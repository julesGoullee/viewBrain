const assert = require('assert');

const Insta = require('instagram-web-api');
const FileCookieStore = require('tough-cookie-filestore2');
const Bottleneck = require('bottleneck');

const Config = require('../../../config');
const { logger } = require('../../utils');
const Interface = require('./interface');
const Follower = require('../models/follower');

class Instagram extends Interface {

  constructor({ username, password } = {}) {

    super();
    assert(username && password, 'invalid_credentials');
    const cookieStore = new FileCookieStore('/tmp/cookies_${username}.json');
    this.username = username;
    this.socialId = null;
    this.initilized = false;

    this.client = new Insta({
      username,
      password,
      cookieStore
    }, { proxy: Config.socialConnectors.instagram.proxy });

    this.limitedGetFollowers = new Bottleneck({
      reservoir: Config.socialConnectors.instagram.coolTimeGetFollower5min,
      reservoirRefreshAmount: Config.socialConnectors.instagram.coolTimeGetFollower5min,
      reservoirRefreshInterval: 5 * 60 * 1000 // 5 minute
    }).wrap(this.client.getFollowers.bind(this.client) );
    this.limitedGetFollowers = new Bottleneck({
      reservoir: Config.socialConnectors.instagram.coolTimeGetFollower1Hour,
      reservoirRefreshAmount: Config.socialConnectors.instagram.coolTimeGetFollower1Hour,
      reservoirRefreshInterval: 60 * 60 * 1000 // 1 hour
    }).wrap(this.limitedGetFollowers);

    this.limitedUploadPhoto = new Bottleneck({
      reservoir: Config.socialConnectors.instagram.coolTimeUploadPhoto5min,
      reservoirRefreshAmount: Config.socialConnectors.instagram.coolTimeUploadPhoto5min,
      reservoirRefreshInterval: 5 * 60 * 1000 // 5 minute
    }).wrap(this.client.uploadPhoto.bind(this.client) );
    this.limitedUploadPhoto = new Bottleneck({
      reservoir: Config.socialConnectors.instagram.coolTimeUploadPhoto1Hour,
      reservoirRefreshAmount: Config.socialConnectors.instagram.coolTimeUploadPhoto1Hour,
      reservoirRefreshInterval: 60 * 60 * 1000 // 1 hour
    }).wrap(this.limitedUploadPhoto);

  }

  async init(){

    logger.info('Instagram init', { username: this.username });

    await this.client.login();

    const profile = await this.client.getProfile();
    assert(profile.is_email_confirmed, 'invalid_profile');

    const me = await this.client.getUserByUsername({ username: this.username });
    assert(me.id, 'invalid_user');

    this.socialId = me.id;
    this.initilized = true;

    logger.info('Instagram initialized', {
      username: this.username,
      socialId: this.socialId
    });

  }

  async getNewFollowers(){

    assert(this.initilized, 'uninitialized_account');

    const newFollowers = [];
    let isEnd = false;
    let after = null;

    while(!isEnd){

      logger.info('getNewFollowers queue', { socialId: this.socialId });

      const followers = await this.limitedGetFollowers({
        userId: this.socialId,
        first: 50,
        after
      });

      const countNewFollowers = newFollowers.length;

      for(let i = 0; i < followers.data.length; i++){

        const follower = followers.data[i];
        const isPresent = await Follower.isPresent({ socialId: follower.id });

        if(!isPresent){

          newFollowers.push({
            socialId: follower.id,
            username: follower.username
          });

        }

      }

      if(countNewFollowers === newFollowers.length || !followers.page_info.has_next_page){

        isEnd = true;

      }

      after = followers.page_info.end_cursor;
      logger.info('getNewFollowers batch finish', { socialId: this.socialId });

    }

    logger.info('getNewFollowers finish all', { socialId: this.socialId });


    return newFollowers;

  }

  async publish(photo, username){

    assert(this.initilized, 'uninitialized_account');

    logger.info('publish queue', {
      socialId: this.socialId,
      username
    });

    const res = await this.limitedUploadPhoto({
      photo,
      caption: `#ok @${username}`
    });

    logger.info('publish end', {
      socialId: this.socialId,
      username
    });

    assert(res.status === 'ok', 'cannot_publish');
    return true;

  }

}

module.exports = Instagram;
