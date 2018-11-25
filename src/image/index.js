const Config = require('../../config');
const { isNode } = require('../utils');
const Model = require('./model');
const Render = require('./render');

const { logger } = require('../utils');

require('@tensorflow/tfjs');

if(isNode() ){

  require('@tensorflow/tfjs-node');

}

(async () => {

  // const renderRandom = new Render({ height, width, blackWhite });
  // renderRandom.drawRandom();

  const inputShape = [parseInt(Config.image.width, 10), parseInt(Config.image.height, 10)];

  const model = new Model({
    inputShape,
    blackWhite: Config.image.blackWhite,
    seed: Config.image.seed,
    scale: Config.image.scale,
    batchSize: parseInt(Config.image.batchSize, 10)
  });

  const render = new Render({
    height: parseInt(Config.image.height, 10),
    width: parseInt(Config.image.width, 10),
    blackWhite: Config.image.blackWhite
  });

  const dataImg =  model.generate();

  await render.draw(dataImg);


})().catch(error => logger.error(error) );
