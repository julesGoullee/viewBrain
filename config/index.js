require('dotenv').config();

module.exports = {

  env: process.env.NODE_ENV || 'development',

  image: {
    height: process.env.IMAGE_HEIGHT || '200',
    width: process.env.IMAGE_WIDTH || '200',
    blackWhite: process.env.BLACK_AND_WHITE === 'true' || false,
    seed: 9202368668,
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
      coolTimeRefreshGetFollower: process.env.SOCIAL_CONNECTOR_TWITTER_COOL_TIME_REFRESH_GET_FOLLOWER || '15',
      coolTimeUploadPhoto: process.env.SOCIAL_CONNECTOR_TWITTER_COOL_TIME_UPLOAD_PHOTO || '300',
      coolTimeRefreshUploadPhoto: process.env.SOCIAL_CONNECTOR_TWITTER_COOL_TIME_REFRESH_UPLOAD_PHOTO || '86400',
    }

  },

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB_NAME || 'socialConnector-dev'
  },

  timberKey: process.env.TIMBER_KEY || null,

  tags: [
    'abstractart',
    'art',
    'creative',
    'creativecoding',
    'generative',
    'generativeart',
    'digitalart',
    'codeart'
  ]

};
