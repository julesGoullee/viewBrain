const Config = require('../../config');
const { isNode } = require('../utils');
const Render = require('./render');

const { logger } = require('../utils');

require('@tensorflow/tfjs');

if(isNode() ){

  require('@tensorflow/tfjs-node');

}

(async () => {

    const render = new Render({
      height: parseInt(Config.image.height, 10),
      width: parseInt(Config.image.width, 10),
      blackWhite: Config.image.blackWhite
    });

    const dataImg = render.drawRandom();

    await render.draw(dataImg, `random`);

})().catch(error => logger.error(error) );
