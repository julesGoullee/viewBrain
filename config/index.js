require('dotenv').config();

module.exports = {

  image: {
    height: process.env.IMAGE_HEIGHT || '200',
    width: process.env.IMAGE_WIDTH || '200',
    blackWhite: false,
    seed: 99152101211,
    scale: 100,
    batchSize: 1000,
    outputsDir: './outputs',
  },

  instagram: {
    username: process.env.INSTAGRAM_USERNAME,
    password: process.env.INSTAGRAM_PASSWORD,
    proxy: process.env.INSTAGRAM_PROXY || null,
    coolTimeGetFollower1min: process.env.INSTAGRAM_COOL_TIME_GET_FOLLOWER_1_MIN || '1',
    coolTimeGetFollower1Hour: process.env.INSTAGRAM_COOL_TIME_GET_FOLLOWER_1_HOUR || '1',
    coolTimeUploadPhoto1min: process.env.INSTAGRAM_COOL_TIME_UPLOAD_PHOTO_1_MIN || '10',
    coolTimeUploadPhoto1Hour: process.env.INSTAGRAM_COOL_TIME_UPLOAD_PHOTO_1_HOUR || '10',
  },

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB_NAME || 'instagram-dev'
  },

};
