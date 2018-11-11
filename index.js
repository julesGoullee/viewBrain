const { height, width, blackWhite, seed, scale, batchSize } = require('./config');
const { isNode } = require('./utils');
const Model = require('./model');
const Render = require('./render');

require('@tensorflow/tfjs');

if(isNode() ){

  require('@tensorflow/tfjs-node');

}

(async () => {

  // const renderRandom = new Render({ height, width, blackWhite });
  // renderRandom.drawRandom();

  const inputShape = [width, height];
  const model = new Model({ inputShape, blackWhite, seed, scale, batchSize });
  const render = new Render({ height, width, blackWhite });

  const dataImg =  model.generate();

  render.draw(dataImg);


})().catch(error => console.error(error) );
