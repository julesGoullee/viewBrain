const fs = require('fs');
const PNG = require('pngjs').PNG;
const { outputsDir } = require('./config');

class Png {

  constructor({ height, width, blackWhite } = {}) {

    this.height = height;
    this.width = width;
    this.blackWhite = blackWhite;
    this.create();
    this.baseDir = outputsDir;
  }

  create(){

    this.png = new PNG({
      filterType: -1,
      inputHasAlpha: true,
      width: this.width,
      height: this.height
    });

  }

  drawRandom(){

    for (let i = 0; i < this.width * this.height * 4; i += 4) {
      this.png.data[i] = Png._randomInt(0, 255); // red
      this.png.data[i+1] = Png._randomInt(0, 255); // green
      this.png.data[i+2] = Png._randomInt(0, 255); // blue
      this.png.data[i+3] = 255; // alpha

    }

    this.png.pack()
      .pipe(fs.createWriteStream(`${this.baseDir}/out_random.png`))
      .on('finish', () => {
        console.log('Written out random!');
      });

  }

  draw(data){

    let j = 0;
    for (let i = 0; i < this.width * this.height * 4; i += 4) {

      if(this.blackWhite){

        this.png.data[i] = 0;
        this.png.data[i+1] = 0;
        this.png.data[i+2] = 0;
        this.png.data[i+3] = data[j];
        j += 1;

      } else {

        this.png.data[i] = data[j];
        this.png.data[i+1] = data[j+1];
        this.png.data[i+2] = data[j+2];
        this.png.data[i+3] = 255;
        j += 3;

      }

    }

    this.png.pack()
      .pipe(fs.createWriteStream(`${this.baseDir}/out.png`) )
      .on('finish', () => {
        console.log('Written out!');
      });

  }

  static _randomInt(min, max) {

    return Math.floor(Math.random() * (max - min + 1)) + min;

  }

}

module.exports = Png;
