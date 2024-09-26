const assert = require('assert');

const { isNode } = require('../utils');

let Viewer = null;

if(isNode() ){

  require('@tensorflow/tfjs-node');
  Viewer = require('./jpg');

} else {

  Viewer = require('./canvas');

}

class Render {

  constructor({ height, width, blackWhite }) {

    assert(height && width, 'height_with_require');
    this.height = height;
    this.width = width;
    this.blackWhite = blackWhite || false;
    this.viewer = new Viewer({ height, width });

  }

  async draw(rgbData, id = null){

    const data = [];

    if(this.blackWhite){

      for (let i = 0; i < rgbData.length; i ++) {
        data.push(
          rgbData[i], // red
          rgbData[i], // green
          rgbData[i], // blue
          255 // alpha
        );

      }

    } else {

      for (let i = 0; i < rgbData.length; i += 3) {
        data.push(
          rgbData[i], // red
          rgbData[i + 1], // green
          rgbData[i + 2], // blue
          255 // alpha
        );

      }

    }


    return this.viewer.draw(data, id);

  }

  static _randomInt(min, max){

    return Math.floor(Math.random() * (max - min + 1)) + min;

  }

}

module.exports = Render;
