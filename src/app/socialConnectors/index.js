const Config = require('../../../config');
const Instagram = require('./instagram');
const Twitter = require('./twitter');

const SocialConnectors = {

  init(){

    switch(Config.socialConnectors.use) {

      case 'instagram' :

        SocialConnectors.instagram = new Instagram({
          username: Config.socialConnectors.instagram.username,
          password: Config.socialConnectors.instagram.password
        });

        break;

      case 'twitter' :

        SocialConnectors.twitter = new Twitter({
          username: Config.socialConnectors.twitter.username,
          password: Config.socialConnectors.twitter.password
        });

        break;

      default:

        throw new Error('unknown_connector');

    }

    return SocialConnectors[Config.socialConnectors.use];

  }

};

module.exports = SocialConnectors;
