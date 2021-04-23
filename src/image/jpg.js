const fs = require('fs');
const assert = require('assert');
const Jpeg = require('jpeg-js');

const Config = require('../../config');
const { logger } = require('../utils');
const Jimp = require('jimp');

class Jpg {

  constructor({ height, width } = {}) {

    this.height = height;
    this.width = width;
    this.baseDir = Config.image.outputsDir;

  }

  async draw(data, id = null){

    assert(data.length === this.height * this.width * 4, 'data_size_wrong');

    return new Promise( (resolve, reject) => {

      new Jimp({ data: Buffer.from(data), height: this.height, width: this.width} , (error, image) => {
        if(error){
          return reject(error);
        }
        // image.convolute([
        //   [0, 0, 0, 0, 0],
        //   [0, 1, 1, 1, 0],
        //   [0, 1, 1, 1, 0],
        //   [0, 1, 1, 1, 0],
        //   [0, 0, 0, 0, 0],
        // ]);
        image.convolute([
          [0.2, 0.2, 0.2],
          [0.2, 0.2, 0.2],
          [0.2, 0.2, 0.2]
        ]);
        // image.posterize(50);
        const path = `${this.baseDir}/out${id ? `_${id}` : ''}.jpg`;
        image.write(path, (error) => {

          if(error){
            return reject(error);
          }

          resolve();

        });
      });
    });
    /*
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
    */
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
