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

  async draw(data, id = null){

    assert(data.length === this.height * this.width * 4, 'data_size_wrong');

    const rawImageData = {
      data: data,
      width: this.width,
      height: this.height
    };

    const path = `${this.baseDir}/out${id ? `_${id}` : ''}.jpg`;
    const stream  = fs.createWriteStream(path);

    const encoded = Jpeg.encode(rawImageData, 100);
    stream.write(encoded.data);
    stream.end();

    return new Promise(resolve => {

      stream.on('finish', () => {
        logger.info('Written file', { path });
        resolve();
      });

    });

  }

  getPath(id){

    return `${this.baseDir}/out${id ? `_${id}` : ''}.jpg`;

  }

  rm(id){

    const path = `${this.baseDir}/out${id ? `_${id}` : ''}.jpg`;

    return new Promise( (resolve, reject) => {

      fs.unlink(path, (error) => {

        if(error){

          reject(error);

        }

        logger.info('Remove file', { path });

        resolve();

      });


    })

  }

}

module.exports = Jpg;
