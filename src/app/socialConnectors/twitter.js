const assert = require('assert');

class Twitter {

  constructor({ username, password } = {}) {

    assert(username && password, 'invalid_username_or_password');
    this.username = username;


  }

  async init(){

  }

  async getNewFollowers(){

  }

  async publish(){

    assert(this.initilized, 'uninitialized_account');

  }

}

module.exports = Twitter;
