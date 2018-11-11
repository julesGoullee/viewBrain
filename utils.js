const Utils = {

  isNode(){
    return process.title !== 'browser';
  }

};

module.exports = Utils;
