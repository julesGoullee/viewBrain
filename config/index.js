require('dotenv').config();

module.exports = {

  env: process.env.NODE_ENV || 'development',

  image: {
    height: process.env.IMAGE_HEIGHT || '200',
    width: process.env.IMAGE_WIDTH || '200',
    blackWhite: process.env.BLACK_AND_WHITE === 'true' || false,
    seed: 1068441726,
    // seed: 9062918455,
    scale: 100,
    batchSize: process.env.IMAGE_BATCH_SIZE || '1000',
    outputsDir: './outputs',
  },

  socialConnectors: {

    use: process.env.SOCIAL_CONNECTOR_USE || 'twitter',

    instagram: {
      username: process.env.SOCIAL_CONNECTOR_INSTAGRAM_USERNAME,
      password: process.env.SOCIAL_CONNECTOR_INSTAGRAM_PASSWORD,
      proxy: process.env.SOCIAL_CONNECTOR_INSTAGRAM_PROXY || null,
      coolTimeGetFollower5min: process.env.SOCIAL_CONNECTOR_INSTAGRAM_COOL_TIME_GET_FOLLOWER_5_MIN || '1',
      coolTimeGetFollower1Hour: process.env.SOCIAL_CONNECTOR_INSTAGRAM_COOL_TIME_GET_FOLLOWER_1_HOUR || '10',
      coolTimeUploadPhoto5min: process.env.SOCIAL_CONNECTOR_INSTAGRAM_COOL_TIME_UPLOAD_PHOTO_5_MIN || '1',
      coolTimeUploadPhoto1Hour: process.env.SOCIAL_CONNECTOR_INSTAGRAM_COOL_TIME_UPLOAD_PHOTO_1_HOUR || '6',
    },

    twitter: {
      consumerKey: process.env.SOCIAL_CONNECTOR_TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.SOCIAL_CONNECTOR_TWITTER_CONSUMER_SECRET,
      accessTokenKey: process.env.SOCIAL_CONNECTOR_TWITTER_ACCESS_TOKEN_KEY,
      accessTokenSecret: process.env.SOCIAL_CONNECTOR_TWITTER_ACCESS_TOKEN_SECRET,
      coolTimeGetFollower: process.env.SOCIAL_CONNECTOR_TWITTER_COOL_TIME_GET_FOLLOWER || '15',
      coolTimeRefreshGetFollower: parseInt(process.env.SOCIAL_CONNECTOR_TWITTER_COOL_TIME_REFRESH_GET_FOLLOWER || 15 * 60 * 1000, 10),
      coolTimeUploadPhoto: process.env.SOCIAL_CONNECTOR_TWITTER_COOL_TIME_UPLOAD_PHOTO || '300',
      coolTimeRefreshUploadPhoto: parseInt(process.env.SOCIAL_CONNECTOR_TWITTER_COOL_TIME_REFRESH_UPLOAD_PHOTO || 86400 * 1000, 10),
      coolTimeFollow: process.env.SOCIAL_CONNECTOR_TWITTER_COOL_TIME_FOLLOW || '41',
      coolTimeRefreshFollow: parseInt(process.env.SOCIAL_CONNECTOR_TWITTER_COOL_TIME_REFRESH_FOLLOW || 3600 * 1000, 10),
      coolTimeUnfollow: process.env.SOCIAL_CONNECTOR_TWITTER_COOL_TIME_UNFOLLOW || '15',
      coolTimeRefreshUnfollow: parseInt(process.env.SOCIAL_CONNECTOR_TWITTER_COOL_TIME_UNFOLLOW|| 15 * 60 * 1000, 10),

    }

  },

  tagWatcher: {

    enable: process.env.TAG_WATCHER_ENABLE === 'true' || false,
    tags: process.env.TAG_WATCHER_TAGS !== '' && process.env.TAG_WATCHER_TAGS.split(',') || [
      'abstractart',
      'NFTart',
      'NFTartist',
      // 'generativeart',
      // 'contemporaryart',
      'NFT',
      'NFTs',
      // 'color',
      // 'colour',
      'cryptoart',
      'NFTCommunity',
      'cryptoart',
      'art',
      'ethereum',
    ],

    intervalFollow: process.env.TAG_WATCHER_INTERVAL_FOLLOW || '3600000', // 1 hour
    timerUnfollow: process.env.TAG_WATCHER_TIMER_UNFOLLOW || '7', // in day
    userByTag: process.env.TAG_WATCHER_USER_BY_TAG || '5',
    watchForFollowing: process.env.TAG_WATCHER_WATCH_FOR_FOLLOWING === 'true' || false,
    unfollowOldFollowing: process.env.TAG_WATCHER_UNFOLLOW_FOLLOWING === 'true' || false,
  },

  handler: {

    enable: process.env.HANDLER_ENABLE === 'true' || false,

  },

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB_NAME || 'socialConnector-dev'
  },

  timber: {
    apiKey: process.env.TIMBER_API_KEY || null,
    sourceId: process.env.TIMBER_SOURCE_ID || null
  },

};
