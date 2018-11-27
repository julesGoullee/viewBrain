const Config = require('../../config');
const { isNode } = require('../utils');
const Model = require('./model');
const Render = require('./render');
const cryptoRandomInt = require('crypto-random-int');

const { logger } = require('../utils');

require('@tensorflow/tfjs');

if(isNode() ){

  require('@tensorflow/tfjs-node');

}

(async () => {

  // const renderRandom = new Render({ height, width, blackWhite });
  // renderRandom.drawRandom();

  const inputShape = [parseInt(Config.image.width, 10), parseInt(Config.image.height, 10)];

  while(true){ // eslint-disable-line no-constant-condition

    const scale = await cryptoRandomInt(5, 200);
    const units = await cryptoRandomInt(8, 512);
    const depth = await cryptoRandomInt(2, 8);

    logger.info('new random', { scale, units, depth });
    const model = new Model({
      inputShape,
      blackWhite: Config.image.blackWhite,
      seed: Config.image.seed,
      scale,
      units,
      depth,
      batchSize: parseInt(Config.image.batchSize, 10)
    });

    const render = new Render({
      height: parseInt(Config.image.height, 10),
      width: parseInt(Config.image.width, 10),
      blackWhite: Config.image.blackWhite
    });

    const dataImg =  model.generate();

    await render.draw(dataImg, `random_scale-${scale}_units-${units}_depth-${depth}`);

  }


})().catch(error => logger.error(error) );
