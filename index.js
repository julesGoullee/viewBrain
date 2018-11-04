const Model = require('./model');

const isNode = () => {
  return process.title !== 'browser';
};

(async () => {

  const height = 700;
  const width = 700;
  const blackWhite = false;

  let Viewer = null;

  if(isNode() ){

    require('@tensorflow/tfjs');
    require('@tensorflow/tfjs-node');
    Viewer = require('./png');

  } else {

    Viewer = require('./canvas');

  }

  // const viewerRandom = new Viewer({ height, width, blackWhite });
  // viewerRandom.drawRandom();

  const viewer = new Viewer({ height, width, blackWhite });
  const inputShape = [width, height];
  const model = new Model({ inputShape, blackWhite });
  const dataImg =  model.generate();
  viewer.draw(dataImg);


})().catch(error => console.error(error) );
