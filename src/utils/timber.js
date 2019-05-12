const { Timber } = require('@timberio/node');
const Transport = require('winston-transport');
const Config = require('../../config');

/* istanbul ignore next */
class TimberTransport extends Transport {

  constructor(opts) {

    super(opts);
    this.timber = new Timber(Config.timber.apiKey, Config.timber.sourceId);

  }

  log(info, callback) {

    setImmediate(() => {

      if (info.error instanceof Error) {

        const error = info.error;
        info.error = {
          message: error.message,
          stack: error.stack
        };

      }

      this.timber[info.level](info.message, info);

    });

    callback();

  }

}

module.exports = TimberTransport;
