const assert = require('assert');
const { isNode } = require('./utils');
let Viewer = null;

if(isNode() ){

  require('@tensorflow/tfjs');
  require('@tensorflow/tfjs-node');
  Viewer = require('./png');

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

    this.create();

  }

  create(){

  }

  drawRandom(){

    const data = [];

    for (let i = 0; i < this.width * this.height * 4; i += 4) {

      if(this.blackWhite){

        const random = Render._randomInt(0, 255);
        data.push(
          random, // red
          random, // green
          random, // blue
          255 // alpha
        );

      } else {

        data.push(
          Render._randomInt(0, 255), // red
          Render._randomInt(0, 255), // green
          Render._randomInt(0, 255), // blue
          255 // alpha
        );

      }

    }

    this.viewer.draw(data);

  }

  draw(rgbData){

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


    this.viewer.draw(data);

  }

  static _randomInt(min, max){

    return Math.floor(Math.random() * (max - min + 1)) + min;

  }

}

module.exports = Render;
