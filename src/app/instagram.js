const assert = require('assert');

const Insta = require('instagram-web-api');
const FileCookieStore = require('tough-cookie-filestore2');
const Bottleneck = require('bottleneck');

const Config = require('../../config');
const { logger } = require('../utils');
const Follower = require('./follower');

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
    }, { proxy: Config.instagram.proxy });

    this.limitedGetFollowers = new Bottleneck({
      reservoir: Config.instagram.coolTimeGetFollower1min,
      reservoirRefreshAmount: Config.instagram.coolTimeGetFollower1min,
      reservoirRefreshInterval: 5 * 60 * 1000 // 5 minute
    }).wrap(this.client.getFollowers.bind(this.client) );
    this.limitedGetFollowers = new Bottleneck({
      reservoir: Config.instagram.coolTimeGetFollower1Hour,
      reservoirRefreshAmount: Config.instagram.coolTimeGetFollower1Hour,
      reservoirRefreshInterval: 60 * 60 * 1000 // 1 hour
    }).wrap(this.limitedGetFollowers);

    this.limitedUploadPhoto = new Bottleneck({
      reservoir: Config.instagram.coolTimeUploadPhoto1min,
      reservoirRefreshAmount: Config.instagram.coolTimeUploadPhoto1min,
      reservoirRefreshInterval: 5 * 60 * 1000 // 5 minute
    }).wrap(this.client.uploadPhoto.bind(this.client) );
    this.limitedUploadPhoto = new Bottleneck({
      reservoir: Config.instagram.coolTimeUploadPhoto1Hour,
      reservoirRefreshAmount: Config.instagram.coolTimeUploadPhoto1Hour,
      reservoirRefreshInterval: 60 * 60 * 1000 // 1 hour
    }).wrap(this.limitedUploadPhoto);

    this.initilized = false;

  }

  async init(){

    logger.info(`Instagram init`);

    await this.client.login();

    const profile = await this.client.getProfile();
    assert(profile.is_email_confirmed, 'invalid_profile');

    const me = await this.client.getUserByUsername({ username: this.username });
    assert(me.id, 'invalid_user');

    this.instagramId = me.id;
    this.initilized = true;

    logger.info(`Instagram connected username: ${this.username} id: ${this.instagramId}`);

  }

  async getNewFollowers(){

    assert(this.initilized, 'uninitialized_account');

    const newFollowers = [];
    let isEnd = false;
    let after = null;

    while(!isEnd){

      logger.info(`getNewFollowers queue`);

      const followers = await this.limitedGetFollowers({
        userId: this.instagramId,
        first: 50,
        after
      });

      const countNewFollowers = newFollowers.length;

      for(let i = 0; i < followers.data.length; i++){

        const follower = followers.data[i];
        const isPresent = await Follower.isPresent({ instagramId: follower.id });

        if(!isPresent){

          newFollowers.push({
            instagramId: follower.id,
            username: follower.username
          });

        }

      }

      if(countNewFollowers === newFollowers.length || !followers.page_info.has_next_page){

        isEnd = true;

      }

      after = followers.page_info.end_cursor;
      logger.info(`getNewFollowers finish`);

    }

    logger.info(`getNewFollowers finish all`);


    return newFollowers;

  }

  async publish(photo, username){

    assert(this.initilized, 'uninitialized_account');

    logger.info(`publish queue ${username}`);

    const res = await this.limitedUploadPhoto({
      photo,
      caption: `#ok @${username}`
    });
    logger.info(`publish end ${username}`);

    assert(res.status === 'ok', 'cannot_publish');
    return true;

  }

}

module.exports = Instagram;
