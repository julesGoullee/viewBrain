const assert = require('assert');

class Canvas {

  constructor({ height, width } = {}) {

    this.height = height || document.body.offsetHeight;
    this.width = width || document.body.offsetWidth;
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

  draw(data){

    assert(data.length === this.imgData.data.length, 'data_size_wrong');

    Object.assign(this.imgData.data, data);

    this.ctx.putImageData(this.imgData, 0, 0);

  }

}

module.exports = Canvas;
