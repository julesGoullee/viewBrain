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

  onNewPost(tag, handler){ // eslint-disable-line no-unused-vars

    throw new Error('not_implemented');

  }

  async follow(username){ // eslint-disable-line no-unused-vars

    throw new Error('not_implemented');

  }

  async unfollow(username){ // eslint-disable-line no-unused-vars

    throw new Error('not_implemented');

  }

}

module.exports = SocialConnector;
