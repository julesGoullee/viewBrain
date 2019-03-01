const path = require('path');

const Interface = require(path.join(srcDir, '/app/socialConnectors/interface') );

module.exports = (sandbox) => {

  const methods = [
    'constructor',
    'init',
    'getNewFollowers',
    'publish',
  ];

  class SocialConnector extends Interface {}

  methods.forEach(method => {

    SocialConnector.prototype[method] = sandbox.stub();

  });

  return SocialConnector;

};
