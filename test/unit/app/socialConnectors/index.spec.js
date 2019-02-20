const path = require('path');
const Config = require(path.join(srcDir, '../config') );
const SocialConnectors = require(path.join(srcDir, '/app/socialConnectors') );
const Instagram = require(path.join(srcDir, '/app/socialConnectors/instagram') );
const Twitter = require(path.join(srcDir, '/app/socialConnectors/twitter') );

describe('SocialConnectors', () => {

  beforeEach( () => {

    this.sandbox = createSandbox();

  });

  afterEach(() => {

    Config.socialConnectors.use = 'instagram';
    delete SocialConnectors.instagram;
    delete Config.socialConnectors.instagram.username;
    delete Config.socialConnectors.instagram.password;
    delete SocialConnectors.twitter;
    delete Config.socialConnectors.twitter.username;
    delete Config.socialConnectors.twitter.password;
    this.sandbox.restore();

  });

  it('Should create instagram switch config', () => {

    Config.socialConnectors.use = 'instagram';
    Config.socialConnectors.instagram.username = 'username';
    Config.socialConnectors.instagram.password = 'password';

    expect(SocialConnectors.instagram).not.to.be.exist;
    const socialConnector = SocialConnectors.init();
    expect(SocialConnectors.instagram).to.be.an.instanceOf(Instagram);
    expect(socialConnector).to.be.eq(SocialConnectors.instagram);

  });

  it('Should create twitter switch config', () => {

    Config.socialConnectors.use = 'twitter';
    Config.socialConnectors.twitter.username = 'username';
    Config.socialConnectors.twitter.password = 'password';

    expect(SocialConnectors.instagram).not.to.be.exist;
    const socialConnector = SocialConnectors.init();
    expect(SocialConnectors.twitter).to.be.an.instanceOf(Twitter);
    expect(socialConnector).to.be.eq(SocialConnectors.twitter);

  });

  it('Should throw with unknown social connector config', () => {

    Config.socialConnectors.use = 'unknown';
    expect(() => SocialConnectors.init()).to.be.throw(Error, 'unknown_connector');

  });

});
