const assert = require('assert');

const Insta = require('instagram-web-api');
const FileCookieStore = require('tough-cookie-filestore2');
const Bottleneck = require('bottleneck');

const Config = require('../../../config');
const { logger } = require('../../utils');
const Follower = require('../follower');

class Instagram {

  constructor({ username, password } = {}) {

    assert(username && password, 'invalid_username_or_password');
    const cookieStore = new FileCookieStore(`./data/cookies_${username}.json`);
    this.username = username;
    this.instagramId = null;
    this.client = new Insta({
      username,
      password,
      cookieStore
    }, { proxy: Config.socialConnectors.instagram.proxy });

    this.coolTimeAfterPublish = 1 * 60 * 1000;
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

    this.initilized = false;

  }

  async init(){

    logger.info('Instagram init', { username: this.username });

    await this.client.login();

    const profile = await this.client.getProfile();
    assert(profile.is_email_confirmed, 'invalid_profile');

    const me = await this.client.getUserByUsername({ username: this.username });
    assert(me.id, 'invalid_user');

    this.instagramId = me.id;
    this.initilized = true;

    logger.info('Instagram initialized', {
      username: this.username,
      instagramId: this.instagramId
    });

  }

  async getNewFollowers(){

    assert(this.initilized, 'uninitialized_account');

    const newFollowers = [];
    let isEnd = false;
    let after = null;

    while(!isEnd){

      logger.info('getNewFollowers queue', { instagramId: this.instagramId });

      const followers = await this.limitedGetFollowers({
        userId: this.instagramId,
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
      logger.info('getNewFollowers finish', { socialId: this.instagramId });

    }

    logger.info('getNewFollowers finish all', { socialId: this.instagramId });


    return newFollowers;

  }

  async publish(photo, username){

    assert(this.initilized, 'uninitialized_account');

    logger.info('publish queue', {
      socialId: this.instagramId,
      username
    });

    const res = await this.limitedUploadPhoto({
      photo,
      caption: `#ok @${username}`
    });

    logger.info('publish end', {
      socialId: this.instagramId,
      username
    });

    assert(res.status === 'ok', 'cannot_publish');
    return true;

  }

}

module.exports = Instagram;