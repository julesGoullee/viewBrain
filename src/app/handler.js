const Config = require('../../config');

const Utils = require('../utils');
const Model = require('../image/model');
const Render = require('../image/render');
const Follower = require('./follower');

class Handler {

  constructor({ socialConnector }) {

    this.socialConnector = socialConnector;

  }

  static async getRender(socialId){

    Utils.logger.info('getRender', { socialId });

    const model = new Model({
      inputShape: Handler.inputShape,
      blackWhite: Config.image.blackWhite,
      seed: parseInt(socialId, 10),
      scale: Config.image.scale,
      batchSize: parseInt(Config.image.batchSize, 10)
    });

    const render = new Render({
      height: parseInt(Config.image.height, 10),
      width: parseInt(Config.image.width, 10),
      blackWhite: Config.image.blackWhite
    });

    const dataImg = model.generate();
    await render.draw(dataImg, socialId);
    Utils.logger.info('getRender finish', { socialId });
    return render;

  }

  async handleOne(follower){

    Utils.logger.info('handleOne start', { socialId: follower.socialId });

    const render = await Handler.getRender(follower.socialId);

    await this.socialConnector.publish(render.viewer.getPath(follower.socialId), follower.username);

    await render.viewer.rm(follower.socialId);

    follower.status = 'uploaded';
    await follower.save();

    Utils.logger.info('handleOne finish', { socialId: follower.socialId });

  }

  async run(){

    Utils.logger.info('Run');

    const newFollowers = await this.socialConnector.getNewFollowers();

    for(let i = 0; i < newFollowers.length; i++){

      const newFollower = new Follower(newFollowers[i]);
      await newFollower.save();

      await this.handleOne(newFollower);
      await Utils.wait(this.socialConnector.coolTimeAfterPublish);

    }

    Utils.logger.info('Run finish', { nbFollowers: newFollowers.length });

  }

}

Handler.inputShape = [parseInt(Config.image.width, 10), parseInt(Config.image.height, 10)];

module.exports = Handler;

