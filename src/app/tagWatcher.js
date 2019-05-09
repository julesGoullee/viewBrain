const moment = require('moment');

const Config = require('../../config');
const Utils = require('../utils');
const Following = require('./models/following');

class TagWatcher {

  constructor({ socialConnector }){

    this.socialConnector = socialConnector;
    this.usersByTag = Config.tagWatcher.tags.reduce((acc, tag) => {

      acc[tag] = [];
      return acc;

    }, {});

    this.stopper = null;
    this.onNewPost = this.onNewPost.bind(this);

  }

  static async sortBestUsers(users){

    const usersSorted =  Object.assign([], users).sort( (user1, user2) => user1.followers > user2.followers ? -1 : 1);
    const bestUsers = [];

    for(let i = 0; i < usersSorted.length; i++){

      const user = usersSorted[i];
      const isPresent = await Following.isPresent({ socialId: user.socialId });

      if(!isPresent){

        bestUsers.push(user);

      }

      if(bestUsers.length === parseInt(Config.tagWatcher.userByTag, 10) ){

        break;

      }

    }

    return bestUsers;

  }

  async watchForFollowing(){

    Config.tagWatcher.tags.forEach( (tag) => {

      this.usersByTag[tag] = [];

    });

    this.stopper = this.socialConnector.onNewPost(this.onNewPost);
    await Utils.wait(Config.tagWatcher.intervalFollow);

    this.stopper();

    await this.followBestUsers();

    this.stopper = null;
    Config.tagWatcher.tags.forEach( (tag) => {

      this.usersByTag[tag] = [];

    });

  }

  async run(){

    Utils.logger.info('TagWatcher start', { service: 'tagWatcher' });

    await Promise.all([]
      .concat(Config.tagWatcher.watchForFollowing ? this.watchForFollowing() : [])
      .concat(Config.tagWatcher.unfollowOldFollowing ? this.unfollowOldFollowing() : [])
    );

    Utils.logger.info('TagWatcher finish', { service: 'tagWatcher' });

  }

  onNewPost({ tag, user }){

    this.usersByTag[tag].push(user);

  }

  async followBestUsers(){

    const stats = Config.tagWatcher.tags.map(tag => ({ tag, count: this.usersByTag[tag].length }) );

    Utils.logger.info('FollowBestUsers', { service: 'tagWatcher', stats });

    await Promise.all(Config.tagWatcher.tags.map(async (tag) => {

      const users = await TagWatcher.sortBestUsers(this.usersByTag[tag]);

      await Promise.all(users.map(async (user) => {

        const following = new Following({
          socialId: user.socialId,
          username: user.username,
          fromTag: tag
        });

        try {

          await this.socialConnector.follow(following.username);
          await following.save();

          Utils.logger.info('New following', {
            service: 'tagWatcher',
            username: following.username,
            fromTag: following.fromTag
          });

        } catch (error){

          Utils.logger.error('Cannot follow', { error, username: following.username });

        }

      }) );

    }) );

  }

  async unfollowOldFollowing(){

    const oldUsers = await Following.findOlds(moment.utc().subtract(Config.tagWatcher.timerUnfollow,'days') );
    await Promise.all(oldUsers.map( async (oldUser) => {

      try {

        await this.socialConnector.unfollow(oldUser.username);
        await oldUser.updateOne({ active: false });

        Utils.logger.info('Unfollow', {
          service: 'tagWatcher',
          username: oldUser.username,
          fromTag: oldUser.fromTag,
          createdAt: oldUser.createdAt.toISOString()
        });

      } catch (error){

        Utils.logger.error('Cannot unfollow', { error, username: oldUser.username });

      }

    }) );

  }

}

module.exports = TagWatcher;
