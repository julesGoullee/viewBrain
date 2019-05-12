const Winston = require('winston');
const TimberTransport = require('./timber');

const Config = require('../../config');

module.exports = (defaultMeta = {}) =>

  Winston.createLogger({
    format: Winston.format.combine(
      Winston.format.timestamp(),
      Winston.format.prettyPrint()
    ),
    defaultMeta,
    transports: [
      new Winston.transports.Console(),
    ].concat(Config.timber.apiKey ? [ new TimberTransport()] : [])

  });
