const moment = require('moment');

const Config = require('../../config');
const Utils = require('../utils');
const Following = require('./models/following');

class TagWatcher {

  constructor({ socialConnector, tags }){

    this.tags = tags;
    this.socialConnector = socialConnector;
    this.usersByTag = this.tags.reduce((acc, tag) => {

      acc[tag] = [];
      return acc;

    }, {});

    this.stopper = null;
    this.onNewPost = this.onNewPost.bind(this)
  }

  static sortBestUsers(users){

    return users.sort( (user1, user2) => user1.followers > user2.followers ? -1 : 1);

  }

  async run(){

    Utils.logger.info('TagWatcher start', { service: 'tagWatcher' });

    this.tags.forEach( (tag) => {

      this.usersByTag[tag] = [];

    });

    this.stopper = this.socialConnector.onNewPost(this.tags, this.onNewPost);

    await Utils.wait(Config.tagWatcher.intervalFollow);

    this.stopper();

    await this.followBestUsers();
    await this.unfollowOldUser();

    this.stopper = null;

    Utils.logger.info('TagWatcher finish', { service: 'tagWatcher' });

  }

  onNewPost({ tag, user }){

    this.usersByTag[tag].push(user);

  }

  async followBestUsers(){

    const stats = this.tags.map(tag => ({ tag, count: this.usersByTag[tag].length }) );

    Utils.logger.info(' FollowBestUsers', { service: 'tagWatcher', stats });

    const users = this.tags.map(tag => {

      return TagWatcher.sortBestUsers(this.usersByTag[tag]).slice(0, Config.tagWatcher.userByTag);

    }).reduce( (acc, item) => acc.concat(item), []);

    await Promise.all(users.map(async (user) => {

      const following = new Following({
        socialId: user.socialId,
        username: user.username
      });

      await this.socialConnector.follow(following.username);

      await following.save();

    }) );

  }

  async unfollowOldUser(){

    const oldUsers = await Following.findOlds(moment.utc().subtract(Config.tagWatcher.timerUnfollow,'days') );
    await Promise.all(oldUsers.map(this.socialConnector.unfollow) );

  }

}

module.exports = TagWatcher;
