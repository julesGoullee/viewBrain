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


  const inputShape = [parseInt(Config.image.width, 10), parseInt(Config.image.height, 10)];

  const seeds = await Promise.all(Array(10).fill().map(() => cryptoRandomInt(111111111, 999999999) ) );
  // { scale: 19, units: 291, depth: 5},

  const configs = [
    { scale: 18, units: 85, depth: 7},
    { scale: 19, units: 228, depth: 7},
    { scale: 19, units: 311, depth: 8},
    { scale: 22, units: 182, depth: 7},

    { scale: 27, units: 133, depth: 7},
    { scale: 29, units: 152, depth: 7},
    { scale: 34, units: 112, depth: 4},
    { scale: 44, units: 31, depth: 8},
    { scale: 54, units: 56, depth: 6},
    { scale: 58, units: 17, depth: 3},
    { scale: 58, units: 98, depth: 3},
    { scale: 72, units: 28, depth: 4},
    { scale: 72, units: 30, depth: 5},
    { scale: 76, units: 58, depth: 5},
    { scale: 89, units: 21, depth: 4},
    { scale: 95, units: 186, depth: 4},
    { scale: 120, units: 103, depth: 4},
    { scale: 128, units: 103, depth: 4},
    { scale: 135, units: 35, depth: 5},
    { scale: 139, units: 69, depth: 4},
    { scale: 154, units: 138, depth: 4},
    { scale: 178, units: 86, depth: 4},
    { scale: 179, units: 112, depth: 4},
    { scale: 198, units: 245, depth: 3},
    { scale: 200, units: 26, depth: 3 }
  ];

  for(let i = 0; i < configs.length; i++){

    const config = configs[i];

    for(let j = 0; j < seeds.length; j++){

      const seed = seeds[j];

      logger.info('new random selected', {
        seed,
        scale: config.scale,
        units: config.units,
        depth: config.depth
      });

      const model = new Model({
        inputShape,
        blackWhite: Config.image.blackWhite,
        seed,
        scale: config.scale,
        units: config.units,
        depth: config.depth,
        batchSize: parseInt(Config.image.batchSize, 10)
      });

      const render = new Render({
        height: parseInt(Config.image.height, 10),
        width: parseInt(Config.image.width, 10),
        blackWhite: Config.image.blackWhite
      });

      const dataImg =  model.generate();

      await render.draw(dataImg, `random_selected_scale-${config.scale}_units-${config.units}_depth-${config.depth}_seed-${seed}`);

    }

  }

})().catch(error => logger.error(error) );
