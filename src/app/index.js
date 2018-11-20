const Config = require('../../config');

const Utils = require('../utils');
const Db = require('./db');
const Instagram = require('./instagram');
const Handler = require('./handler');

async function Run(){

  let stop = null;

  const onError = async (error) => {

    Utils.logger.error(error);
    stop && stop();
    await Db.disconnect();

  };

  try {

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

    stop = Utils.infiniteLoop(async () => {

      await handler.run();

    }, onError);

    return stop;

  } catch (error) {

    await onError(error);

  }

}

/* istanbul ignore if */
if(require.main === module){

  (async () => {

    await Run();

  })().catch(error => Utils.logger.error(error) );

} else {

  module.exports = Run;

}

