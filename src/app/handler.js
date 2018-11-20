const Config = require('../../config');

const { logger } = require('../utils');
const Model = require('../image/model');
const Render = require('../image/render');
const Follower = require('./follower');

class Handler {

  constructor({ instagram }) {

    this.instagram = instagram;

  }

  static async getRender(instagramId){

    logger.info(`getRender ${instagramId}`);

    const model = new Model({
      inputShape: Handler.inputShape,
      blackWhite: Config.image.blackWhite,
      seed: parseInt(instagramId, 10),
      scale: Config.image.scale,
      batchSize: Config.image.batchSize
    });

    const render = new Render({
      height: parseInt(Config.image.height, 10),
      width: parseInt(Config.image.width, 10),
      blackWhite: Config.image.blackWhite
    });

    const dataImg = model.generate();
    await render.draw(dataImg, instagramId);
    logger.info(`getRender finish ${instagramId}`);

    return render;

  }

  async handleOne(follower){

    logger.info(`handleOne start ${follower.instagramId}`);

    const render = await Handler.getRender(follower.instagramId);

    await this.instagram.publish(render.viewer.getPath(follower.instagramId), follower.username);

    await render.viewer.rm(follower.instagramId);

    follower.status = 'uploaded';
    await follower.save();

    logger.info(`handleOne finish ${follower.instagramId}`);

  }

  async run(){

    logger.info(`Run`);

    const newFollowers = await this.instagram.getNewFollowers();

    for(let i = 0; i < newFollowers.length; i++){

      const newFollower = new Follower(newFollowers[i]);
      await newFollower.save();

      await this.handleOne(newFollower);

    }

    logger.info(`Run finish with ${newFollowers.length} new`);

  }

}

Handler.inputShape = [parseInt(Config.image.width, 10), parseInt(Config.image.height, 10)];

module.exports = Handler;

