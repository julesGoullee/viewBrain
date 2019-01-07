const winston = require('winston');
const timber = require('timber');
const Config = require('../config');
// const transport = new timber.transports.HTTPS(Config.timberKey);
// timber.install(transport);

const logger = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: 'silly',
      formatter: Config.env === 'production' ? timber.formatters.Winston : null
    }),
  ]
});

const Utils = {

  isNode(){
    return process.title !== 'browser';
  },

  get logger(){
    return console;
  },

  wait(ms){

    return new Promise(resolve => setTimeout(resolve, ms) );

  },

  infiniteLoop(fn, onError = (error) => Utils.logger.error(error)){

    let run = true;

    async function loop(){

      while(run){

        await fn().catch(onError);

      }

    }

    loop().catch(onError);

    return () => run = false;

  }

};

module.exports = Utils;
