const fs = require('fs');
const assert = require('assert');
const PNG = require('pngjs').PNG;
const { outputsDir } = require('./config');

class Png {

  constructor({ height, width } = {}) {

    this.height = height;
    this.width = width;
    this.baseDir = outputsDir;
    this.create();

  }

  create(){

    this.png = new PNG({
      filterType: -1,
      inputHasAlpha: true,
      width: this.width,
      height: this.height
    });

  }

  draw(data){

    assert(data.length === this.png.data.length, 'data_size_wrong');

    this.png.data = data;

    this.png.pack()
      .pipe(fs.createWriteStream(`${this.baseDir}/out.png`) )
      .on('finish', () => {
        console.log('Written out!');
      });

  }

}

module.exports = Png;
