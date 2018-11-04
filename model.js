const tf = require('@tensorflow/tfjs');

class Model {

  constructor({ inputShape, blackWhite } = {}) {

    this.inputShape = inputShape;
    this.scale = 40;
    this.units = 32;
    this.input = 3;
    this.blackWhite = blackWhite;
    this.useBias = false;
    this.model = this.buildModel();
    this.model.summary();

  }

  buildModel(){

    const initializer = tf.initializers.varianceScaling({
      seed: 1337,
      scale: this.scale,
      distribution: 'normal'
    });
    const model = tf.sequential();

    model.add(tf.layers.dense({
      inputShape: [this.input],
      units: this.units,
      kernelInitializer: initializer,
      biasInitializer: initializer,
      useBias: this.useBias,
      activation: 'tanh',
    }));

    model.add(tf.layers.dense({
      units: this.units,
      kernelInitializer: initializer,
      biasInitializer: initializer,
      useBias: this.useBias,
      activation: 'tanh',
    }));

    model.add(tf.layers.dense({
      units: 32,
      kernelInitializer: initializer,
      biasInitializer: initializer,
      useBias: this.useBias,
      activation: 'tanh',
    }));

    model.add(tf.layers.dense({
      units: (this.blackWhite ? 1 : 3),
      kernelInitializer: initializer,
      useBias: this.useBias,
      biasInitializer: initializer,
      activation: 'tanh',
    }));

    model.compile({
      loss: 'meanSquaredError',
      optimizer: 'rmsprop',
      metrics: ['accuracy']
    });

    return model;

  }

  generate(){

    const data = [];

    for(let i = 0; i < this.inputShape[0]; i++){

      for(let j = 0; j < this.inputShape[1]; j++){

        data.push(Math.pow(i, 2) , Math.pow(j, 2), Math.sqrt(i * i + j * j));

      }

    }

    const input = tf.tensor2d(data, [this.inputShape[0] * this.inputShape[1], this.input]);

    console.log('tensor ready, predict...');
    console.time('compute');
    const output = this.model.predict(Model.normalizeTensor(input) );
    console.timeEnd('compute');

    console.log(`Predict done output min: ${output.min().dataSync()[0]} max: ${output.max().dataSync()[0]}`);

    return Model.normalize(output.dataSync() );

  }

  static normalize(data){

    return data.map(d => parseInt( (d+ 1) * 255 / 2) );

  }

  static determineMeanAndStddev(data) {
    const dataMean = data.mean(0);
    const diffFromMean = data.sub(dataMean);
    const squaredDiffFromMean = diffFromMean.square();
    const variance = squaredDiffFromMean.mean(0);
    const dataStd = variance.sqrt();
    return {dataMean, dataStd};
  }


  static normalizeTensor(data) {
    const { dataMean, dataStd } = Model.determineMeanAndStddev(data);
    return data.sub(dataMean).div(dataStd);
  }

}

module.exports = Model;

