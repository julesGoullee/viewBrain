const Config = require('../../config');
const Utils = require('../utils');
const Db = require('./models/db');
const SocialConnectors = require('./socialConnectors');
const Handler = require('./handler');
const TagWatcher = require('./tagWatcher');

async function Run(){

  const stoppers = {};

  const onError = async (error) => {

    Utils.logger.error(error);
    Object.keys(stoppers).forEach(stopper => stoppers[stopper]() );
    await Db.disconnect();

  };

  try {

    const socialConnector = SocialConnectors.init();
    const handler = new Handler({ socialConnector });

    await Promise.all([
      Db.connect(),
      socialConnector.init()
    ]);

    stoppers.handler = Utils.infiniteLoop(async () => {

      await handler.run();

    }, onError);

    if(Config.tagWatcher.enable){

      const tagWatcher = new TagWatcher({ socialConnector, tags: Config.tagWatcher.tags });

      stoppers.tagWatcher = Utils.infiniteLoop(async () => {

        await tagWatcher.run();

      }, onError);

    }


    return stoppers;

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

