const Config = require('../../config');

const Model = require('../image/model');
const Render = require('../image/render');
const Follower = require('./follower');

class Handler {

  constructor({ instagram }) {

    this.instagram = instagram;

  }

  static async getRender(instagramId){

    const model = new Model({
      inputShape: Handler.inputShape,
      blackWhite: Config.image.blackWhite,
      seed: parseInt(instagramId, 10),
      scale: Config.image.scale,
      batchSize: Config.image.batchSize
    });

    const render = new Render({
      height: Config.image.height,
      width: Config.image.width,
      blackWhite: Config.image.blackWhite
    });

    const dataImg = model.generate();
    await render.draw(dataImg, instagramId);

    return render;

  }

  async handleOne(follower){

    const render = await Handler.getRender(follower.instagramId);

    await this.instagram.publish(render.viewer.getPath(follower.instagramId), follower.username);

    await render.viewer.rm(follower.instagramId);

    follower.status = 'uploaded';
    await follower.save();

  }

  async run(){

    const newFollowers = await this.instagram.getNewFollowers();

    for(let i = 0; i < newFollowers.length; i++){

      const newFollower = new Follower(newFollowers[i]);
      await newFollower.save();

      await this.handleOne(newFollower);

    }

  }

}

Handler.inputShape = [Config.image.width, Config.image.height];

module.exports = Handler;

