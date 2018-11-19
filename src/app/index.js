const Config = require('../../config');

const Utils = require('../utils');
const Db = require('./db');
const Instagram = require('./instagram');
const Handler = require('./handler');

async function Run(){

  const instagram = new Instagram({
    username: Config.instagram.username,
    password: Config.instagram.password,
    proxy: Config.instagram.proxy
  });

  const handler = new Handler({ instagram });

  await Promise.all([
    Db.connect(),
    instagram.init()
  ]);

  return Utils.infiniteLoop(async () => {

    await handler.run();

  });

}

/* istanbul ignore if */
if(require.main === module){

  (async () => {

    let stop = null;

    stop = await Run().catch(error => {

      Utils.logger.error(error);
      stop && stop();

    });

  })().catch(error => Utils.logger.error(error) );

} else {

  module.exports = Run;

}

