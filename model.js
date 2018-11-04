const tf = require('@tensorflow/tfjs');

class Model {

  constructor({ inputShape, blackWhite, seed, scale, batchSize } = {}) {

    this.inputShape = inputShape;
    this.blackWhite = blackWhite;
    this.seed = seed;
    this.scale = scale;
    this.units = 32;
    this.numFeatures = 3;
    this.useBias = true;
    this.model = this.buildModel();
    this.model.summary();
    this.batchSize = batchSize;

  }

  buildModel(){

    const initializer = tf.initializers.varianceScaling({
      seed: this.seed,
      scale: this.scale,
      distribution: 'normal'
    });
    const model = tf.sequential();

    model.add(tf.layers.dense({
      inputShape: [this.numFeatures],
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
      // kernelInitializer: initializer,
      // useBias: this.useBias,
      // biasInitializer: initializer,
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

    const features = [];

    for(let i = 0; i < this.inputShape[0]; i++){

      for(let j = 0; j < this.inputShape[1]; j++){

        features.push(Math.pow(i, 2) , Math.pow(j, 2), Math.sqrt(i * i + j * j));

      }

    }

    const input = tf.tensor2d(features, [this.inputShape[0] * this.inputShape[1], this.numFeatures]);

    console.log('tensor ready, predict...');
    console.time('compute');
    const output = this.miniBatch(Model.normalizeTensor(input) );
    console.timeEnd('compute');

    console.log(`Predict done output min: ${output.min().dataSync()[0]} max: ${output.max().dataSync()[0]}`);

    return Model.normalize(output.dataSync() );

  }

  miniBatch(features){

    let arePending = true;
    let i = 0;
    let output = null;

    const totalBach = Math.round(features.shape[0] / this.batchSize);
    console.log(`Total batch: ${totalBach}`);

    while (arePending){

      let batchFeatures = [];

      if(i * this.batchSize + this.batchSize >= features.shape[0]){

        arePending = false;
        batchFeatures = batchFeatures.concat(features.slice(i * this.batchSize, features.shape[0] - i * this.batchSize));

      } else {

        batchFeatures = batchFeatures.concat(features.slice(i * this.batchSize, this.batchSize));

      }
      console.log(`Compute ${i + 1}/${totalBach} batch`);
      console.time('compute_one');
      const outputBatch = this.model.predict(batchFeatures);

      if(!output){

        output = outputBatch;

      } else {

        output = output.concat(outputBatch);

      }

      console.timeEnd('compute_one');

      i++;

    }

    return output;

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

