
class Canvas {

  constructor({ height, width, blackWhite } = {}) {

    this.height = height || document.body.offsetHeight;
    this.width = width || document.body.offsetWidth;
    this.blackWhite = blackWhite || false;
    this.create();

  }

  create(){

    this.element = document.createElement('canvas');
    this.element.width = this.width;
    this.element.height = this.height;
    this.ctx = this.element.getContext('2d');
    this.imgData = this.ctx.getImageData(0, 0, this.element.width, this.element.height);
    document.body.appendChild(this.element);
    
  }

  drawRandom(){

    for (let i = 0; i < this.imgData.data.length; i += 4) {
      this.imgData.data[i] = Canvas._randomInt(0, 255); // red
      this.imgData.data[i+1] = Canvas._randomInt(0, 255); // green
      this.imgData.data[i+2] = Canvas._randomInt(0, 255); // blue
      this.imgData.data[i+3] = 255; // alpha

    }

    this.ctx.putImageData(this.imgData, 0, 0);

  }

  draw(data){

    let j = 0;
    for (let i = 0; i < this.imgData.data.length; i += 4) {

      if(this.blackWhite){

        this.imgData.data[i] = 0;
        this.imgData.data[i+1] = 0;
        this.imgData.data[i+2] = 0;
        this.imgData.data[i+3] = data[j];
        j += 1;

      } else {

        this.imgData.data[i] = data[j];
        this.imgData.data[i+1] = data[j+1];
        this.imgData.data[i+2] = data[j+2];
        this.imgData.data[i+3] = 255;
        j += 3;

      }

    }

    this.ctx.putImageData(this.imgData, 0, 0);

  }

  static _randomInt(min, max) {

    return Math.floor(Math.random() * (max - min + 1)) + min;

  }

}

module.exports = Canvas;
