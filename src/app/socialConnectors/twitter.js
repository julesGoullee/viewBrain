const assert = require('assert');
const fs = require('fs');
const { promisifyAll } = require('bluebird');
const Twit = require('twitter');
const Bottleneck = require('bottleneck');

const Config = require('../../../config');
const { logger } = require('../../utils');
const Interface = require('./interface');
const Follower = require('../models/follower');

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
      reservoirRefreshInterval: Config.socialConnectors.twitter.coolTimeRefreshGetFollower,
      minTime: 60 * 1000
    }).wrap(this.client.getAsync.bind(this.client) );

    this.limitedUploadPhoto = new Bottleneck({
      reservoir: Config.socialConnectors.twitter.coolTimeUploadPhoto,
      reservoirRefreshAmount: Config.socialConnectors.twitter.coolTimeUploadPhoto,
      reservoirRefreshInterval: Config.socialConnectors.twitter.coolTimeRefreshUploadPhoto,
      minTime: 60 * 1000
    }).wrap(this.client.postAsync.bind(this.client) );

    this.limitedUploadPhotoTweet = new Bottleneck({
      reservoir: Config.socialConnectors.twitter.coolTimeUploadPhoto,
      reservoirRefreshAmount: Config.socialConnectors.twitter.coolTimeUploadPhoto,
      reservoirRefreshInterval: Config.socialConnectors.twitter.coolTimeRefreshUploadPhoto,
      minTime: 60 * 1000
    }).wrap(this.client.postAsync.bind(this.client) );

    this.limitedFollow = new Bottleneck({
      reservoir: Config.socialConnectors.twitter.coolTimeFollow,
      reservoirRefreshAmount: Config.socialConnectors.twitter.coolTimeFollow,
      reservoirRefreshInterval: Config.socialConnectors.twitter.coolTimeRefreshFollow,
      minTime: 60 * 1000
    }).wrap(this.client.postAsync.bind(this.client) );

    this.limitedUnfollow = new Bottleneck({
      reservoir: Config.socialConnectors.twitter.coolTimeUnfollow,
      reservoirRefreshAmount: Config.socialConnectors.twitter.coolTimeUnfollow,
      reservoirRefreshInterval: Config.socialConnectors.twitter.coolTimeRefreshUnfollow,
      minTime: 60 * 1000
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

  async publish(pathPhoto, username){

    assert(this.initilized, 'uninitialized_account');

    logger.info('publish queue', {
      socialId: this.socialId,
      username
    });

    const photo = fs.readFileSync(pathPhoto);

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

  onNewPost(tags, handler){

    assert(this.initilized, 'uninitialized_account');

    const track = tags.reduce( (acc, tag, i) => {

      if(i === 0){

        return `#${tag}`;

      }

      return `${acc},#${tag}`;

    }, '');

    const stream = this.client.stream('statuses/filter', { track });

    stream.on('data', (event) => {

      if(!event.extended_tweet || !event.extended_tweet.full_text){
        return;
      }

      const tag = tags.find(tag => event.extended_tweet.full_text.includes(tag) );

      if(!tag){
        return;
      }

      handler({
        tag,
        user: {
          socialId: event.user.id,
          username: event.user.screen_name
        }
      });

    });

    stream.on('error', (error) => {

      logger.error('error on new post', { tags, error: error.message });

    });

    return () => stream.destroy();

  }

  async follow(username){

    assert(this.initilized, 'uninitialized_account');

    const followRes = await this.limitedFollow('friendships/create', {
      screen_name: username,
    });

    assert(followRes.id, 'cannot_follow');

  }

  async unfollow(username){

    assert(this.initilized, 'uninitialized_account');

    const followRes = await this.limitedUnfollow('friendships/destroy', {
      screen_name: username,
    });

    assert(followRes.id, 'cannot_unfollow');

  }

}

module.exports = Twitter;
