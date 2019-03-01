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
          consumerKey: Config.socialConnectors.twitter.consumerKey,
          consumerSecret: Config.socialConnectors.twitter.consumerSecret,
          accessTokenKey: Config.socialConnectors.twitter.accessTokenKey,
          accessTokenSecret: Config.socialConnectors.twitter.accessTokenSecret,
        });

        break;

      default:

        throw new Error('unknown_connector');

    }

    return SocialConnectors[Config.socialConnectors.use];

  }

};

module.exports = SocialConnectors;
