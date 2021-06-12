const Utils = require('../utils');
const Db = require('./models/db');
const SocialConnectors = require('./socialConnectors');
const Handler = require('./handler');
const Follower = require('./models/follower');

const stoppers = {};

async function onError (error){

  /* istanbul ignore else */
  if(error && error.message){

    Utils.logger.error(error);

  } else {

    // eslint-disable-next-line
    console.error(error);

  }

  Object.keys(stoppers).forEach(stopper => stoppers[stopper]() );
  await Db.disconnect();
  // eslint-disable-next-line
  // process.exit(0);

}

async function Run(){

  try {

    const socialId = process.env.RUN_ONE_SOCIAL_ID;
    if (!socialId){
      throw new Error('socialId not found')
    }
    const socialConnector = SocialConnectors.init();

    await Promise.all([
      Db.connect(),
      socialConnector.init()
    ]);

    const follower = await Follower.findOne({ socialId });
    if (!follower){
      throw new Error('follower not found')
    }
    const handler = new Handler({ socialConnector });
    await handler.handleOne(follower);

    // eslint-disable-next-line
    process.exit(0);

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

