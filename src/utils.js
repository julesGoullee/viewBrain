const winston = require('winston');

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console()
  ]
});

const Utils = {

  isNode(){
    return process.title !== 'browser';
  },

  get logger(){
    return logger;
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
