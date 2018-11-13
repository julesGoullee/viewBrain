const Utils = {

  isNode(){
    return process.title !== 'browser';
  },

  get logger(){
    return console;
  }

};

module.exports = Utils;
