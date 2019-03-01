const Utils = require('../utils');
const Db = require('./db');
const SocialConnectors = require('./socialConnectors');
const Handler = require('./handler');

async function Run(){

  let stop = null;

  const onError = async (error) => {

    Utils.logger.error(error);
    stop && stop();
    await Db.disconnect();

  };

  try {

    const socialConnector = SocialConnectors.init();
    const handler = new Handler({ socialConnectors: socialConnector });

    await Promise.all([
      Db.connect(),
      socialConnector.init()
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

