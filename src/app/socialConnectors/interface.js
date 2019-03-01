class SocialConnector {

  constructor(){

    this.coolTimeAfterPublish = 30 * 1000; // 30s

  }

  async init(){

    throw new Error('not_implemented');

  }

  async getNewFollowers(){

    throw new Error('not_implemented');

  }

  async publish(photo, username){ // eslint-disable-line no-unused-vars

    throw new Error('not_implemented');

  }

}

module.exports = SocialConnector;
