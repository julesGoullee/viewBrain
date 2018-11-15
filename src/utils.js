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

  infiniteLoop(fn){

    let run = true;

    const onError = (error) => Utils.logger.error(error);

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
