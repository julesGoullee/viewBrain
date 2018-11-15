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

  const inputShape = [Config.image.width, Config.image.height];

  const model = new Model({
    inputShape,
    blackWhite: Config.image.blackWhite,
    seed: Config.image.seed,
    scale: Config.image.scale,
    batchSize: Config.image.batchSize
  });

  const render = new Render({
    height: Config.image.height,
    width: Config.image.width,
    blackWhite: Config.image.blackWhite
  });

  const dataImg =  model.generate();

  await render.draw(dataImg);


})().catch(error => logger.error(error) );
