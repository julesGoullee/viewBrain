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

    this.stoppers = [];

  }

  static sortBestUsers(users){

    return users.sort( (user1, user2) => user1.followers > user2.followers ? -1 : 1);

  }

  async run(){

    Utils.logger.info('Run', { service: 'tagWatcher' });

    this.stoppers = this.tags.map(tag => this.socialConnector.onNewPost(tag, this.onNewPost) );

    await Utils.wait(Config.tagWatcher.intervalFollow);

    this.stoppers.forEach(stopper => stopper());

    await this.followBestUsers();
    await this.unfollowOldUser();

    this.stoppers = [];
    this.tags.forEach( (tag) => {

      this.usersByTag[tag] = [];

    });

    Utils.logger.info('Run finish', { service: 'tagWatcher' });

  }

  onNewPost(tag, post){

    this.usersByTag[tag].push(post.user);

  }

  async followBestUsers(){

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
