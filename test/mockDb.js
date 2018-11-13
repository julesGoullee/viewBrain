const mongoose = require('mongoose');
const MongoMemoryServer = require('mongodb-memory-server');
const config = require('../config');

const Mock = {

  mongod: null,

  async start(){

    Mock.mongod = new MongoMemoryServer.default({
      instance: {
        port: 27017,
        dbName: config.mongo.dbName,
      },
    });

    await Mock.mongod.getConnectionString();

  },

  async reset(){

    await mongoose.connection.dropDatabase();

  },

  async stop(){

    await Mock.mongod.stop();

  }
};

module.exports = Mock;

