require('dotenv').config();

module.exports = {

  image: {
    height: 150,
    width: 150,
    blackWhite: false,
    seed: 99152101211,
    scale: 100,
    batchSize: 5000,
    outputsDir: './outputs',
  },

  instagram: {
    username: process.env.INSTAGRAM_USERNAME,
    password: process.env.INSTAGRAM_PASSWORD
  },

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGO_DB_NAME || 'instagram-dev'
  },

};
