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

  instagram: {
    username: process.env.INSTAGRAM_USERNAME,
    password: process.env.INSTAGRAM_PASSWORD,
    proxy: process.env.INSTAGRAM_PROXY || null,
    coolTimeGetFollower5min: process.env.INSTAGRAM_COOL_TIME_GET_FOLLOWER_5_MIN || '1',
    coolTimeGetFollower1Hour: process.env.INSTAGRAM_COOL_TIME_GET_FOLLOWER_1_HOUR || '10',
    coolTimeUploadPhoto5min: process.env.INSTAGRAM_COOL_TIME_UPLOAD_PHOTO_5_MIN || '1',
    coolTimeUploadPhoto1Hour: process.env.INSTAGRAM_COOL_TIME_UPLOAD_PHOTO_1_HOUR || '6',
  },

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB_NAME || 'instagram-dev'
  },

  timberKey: process.env.TIMBER_KEY || null
};
