const Config = require('../../config');
const { isNode } = require('../utils');
const Model = require('./model');
const Render = require('./render');

const { logger } = require('../utils');

if(isNode() ){

  require('@tensorflow/tfjs-node');

} else {

  require('@tensorflow/tfjs');

}

(async () => {

  // const renderRandom = new Render({ height, width, blackWhite });
  // renderRandom.drawRandom();

  const addresses = [
    '0xf2e50F2747cE2E5e04D791b7BD501A5CD4673cf0',
    '0xfBE14B556309b828Ab2E0F0300FABe0E7E0842c8',
    '0x5a64Bc3AF321c1403C108d8a7886787aaEB6411F',
    '0x73b37E755a6Cd65Fe1E3EE0cc134053BD39e8aFB',
    '0x4D660D4105ccB60Dc5A35740102adB50c84F894c',
    '0xf10115Dd64a0b4d98352796D97e99112B23d4aaA',
    '0x91d76EC6355dbe983007dee0Bbf9B37AB3939b2E',
    '0x52E18b855993BdDE701E6Ccf5b30b991991ac49e',
    '0xEeE4b86075666626Ea3f1c5198a2bb41051689A7',
    '0x0A3D5C8894bBE1E9113e4eD6f0c3B0D4Fa6b131E',
    '0x4Cb9b406D430eE2065556C0f73668bc435116822'
  ];

  for(let address of addresses){

    const seed = parseInt(address, 16) / 1000000000000000000000;
    const inputShape = [parseInt(Config.image.width, 10), parseInt(Config.image.height, 10)];

    const model = new Model({
      inputShape,
      blackWhite: Config.image.blackWhite,
      seed: seed,
      scale: Config.image.scale,
      batchSize: parseInt(Config.image.batchSize, 10)
    });

    const render = new Render({
      height: parseInt(Config.image.height, 10),
      width: parseInt(Config.image.width, 10),
      blackWhite: Config.image.blackWhite
    });

    const dataImg = model.generate();

    await render.draw(dataImg, address);

  }

})().catch(error => logger.error(error) );
