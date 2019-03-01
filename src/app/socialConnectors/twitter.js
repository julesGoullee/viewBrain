const assert = require('assert');
const { promisifyAll } = require('bluebird');
const Twit = require('twitter');
const Bottleneck = require('bottleneck');

const Config = require('../../../config');
const { logger } = require('../../utils');
const Interface = require('./interface');
const Follower = require('../follower');

class Twitter extends Interface {

  constructor({ consumerKey, consumerSecret, accessTokenKey, accessTokenSecret } = {}) {

    super();
    assert(consumerKey && consumerSecret && accessTokenKey && accessTokenSecret, 'invalid_credentials');
    this.socialId = null;
    this.initilized = false;

    this.client = promisifyAll(new Twit({
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
      access_token_key: accessTokenKey,
      access_token_secret: accessTokenSecret
    }) );

    this.limitedGetFollowers = new Bottleneck({
      reservoir: Config.socialConnectors.twitter.coolTimeGetFollower,
      reservoirRefreshAmount: Config.socialConnectors.twitter.coolTimeGetFollower,
      reservoirRefreshInterval: Config.socialConnectors.twitter.coolTimeRefreshGetFollower
    }).wrap(this.client.getAsync.bind(this.client) );

    this.limitedUploadPhoto = new Bottleneck({
      reservoir: Config.socialConnectors.twitter.coolTimeUploadPhoto,
      reservoirRefreshAmount: Config.socialConnectors.twitter.coolTimeUploadPhoto,
      reservoirRefreshInterval: Config.socialConnectors.twitter.coolTimeRefreshUploadPhoto
    }).wrap(this.client.postAsync.bind(this.client) );

    this.limitedUploadPhotoTweet = new Bottleneck({
      reservoir: Config.socialConnectors.twitter.coolTimeUploadPhoto,
      reservoirRefreshAmount: Config.socialConnectors.twitter.coolTimeUploadPhoto,
      reservoirRefreshInterval: Config.socialConnectors.twitter.coolTimeRefreshUploadPhoto
    }).wrap(this.client.postAsync.bind(this.client) );
  }

  async init(){

    logger.info('Twitter init');

    const credentials = await this.client.getAsync('account/verify_credentials');

    assert(credentials.screen_name && credentials.id, 'invalid_user');

    this.socialId = credentials.id;
    this.initilized = true;

    logger.info('Twitter initialized', {
      socialId: this.socialId
    });

  }

  async getNewFollowers(){

    assert(this.initilized, 'uninitialized_account');

    const newFollowers = [];
    let isEnd = false;
    let cursor = -1;

    while(!isEnd){

      logger.info('getNewFollowers queue', { socialId: this.socialId });

      const followers = await this.limitedGetFollowers('followers/list', {
        count: 200,
        skip_status: true,
        cursor,
      });

      const countNewFollowers = newFollowers.length;

      for(let i = 0; i < followers.users.length; i++){

        const follower = followers.users[i];
        const isPresent = await Follower.isPresent({ socialId: follower.id });

        if(!isPresent){

          newFollowers.push({
            socialId: follower.id,
            username: follower.screen_name
          });

        }

      }

      if(countNewFollowers === newFollowers.length || !followers.next_cursor){

        isEnd = true;

      }

      cursor = followers.next_cursor;
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

    const mediaRes = await this.limitedUploadPhoto('media/upload', { media: photo });

    assert(mediaRes.media_id_string, 'cannot_publish_media');

    const tweetRes = await this.limitedUploadPhotoTweet('statuses/update', {
      status: `ok @${username}`,
      media_ids: mediaRes.media_id_string
    });

    logger.info('publish end', {
      socialId: this.socialId,
      username
    });

    assert(tweetRes.id, 'cannot_publish');
    return true;

  }

}

module.exports = Twitter;
