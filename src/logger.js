const Winston = require('winston');
const timber = require('timber');
const Config = require('../config');
// const transport = new timber.transports.HTTPS(Config.timberKey);
// timber.install(transport);

module.exports = () => new Winston.Logger({
  transports: [
    new Winston.transports.Console({
      level: 'silly',
      formatter: Config.env === 'production' ? timber.formatters.Winston : null
    }),
  ]
});
