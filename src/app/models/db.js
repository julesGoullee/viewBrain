const mongoose = require('mongoose');
const Config = require('../../../config');
const { logger } = require('../../utils');

const Db = {

  async connect(){

    await mongoose.connect(Config.mongo.uri, {
      dbName: Config.mongo.dbName,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      keepAlive: true,
      useCreateIndex: true
    });

    process.on('SIGINT', Db.disconnect);
    process.on('SIGTERM', Db.disconnect);
    process.on('SIGHUP', Db.disconnect);

    logger.info('Db connected');

  },

  isConnected(){

    return mongoose.connection.readyState === 1;

  },

  async disconnect(){

    await mongoose.disconnect();
    logger.info('Db disconnected');

  }

};

module.exports = Db;
