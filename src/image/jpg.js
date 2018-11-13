const fs = require('fs');
const assert = require('assert');
const Jpeg = require('jpeg-js');

const Config = require('../../config');
const { logger } = require('../utils');

class Jpg {

  constructor({ height, width } = {}) {

    this.height = height;
    this.width = width;
    this.baseDir = Config.image.outputsDir;

  }

  async draw(data){

    assert(data.length === this.height * this.width * 4, 'data_size_wrong');

    const rawImageData = {
      data: data,
      width: this.width,
      height: this.height
    };

    const stream  = fs.createWriteStream(`${this.baseDir}/out.jpg`);

    const encoded = Jpeg.encode(rawImageData, 100);
    stream.write(encoded.data);
    stream.end();

    return new Promise(resolve => {

      stream.on('finish', () => {
        logger.info('Written out!');
        resolve();
      });

    });

  }

}

module.exports = Jpg;
