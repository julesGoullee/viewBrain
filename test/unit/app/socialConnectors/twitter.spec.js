const path = require('path');
const Twit = require('twitter');
const fs = require('fs');

const Config = require(path.join(srcDir, '../config') );
const { logger } = require(path.join(srcDir, '/utils') );

const Db = require(path.join(srcDir, '/app/models/db') );
const Follower = require(path.join(srcDir, '/app/models/follower') );
const Twitter = require(path.join(srcDir, '/app/socialConnectors/twitter') );

describe('SocialConnectors:Twitter', () => {

  before( async () => {

    await MockDb.start();

    await Db.connect();

  });

  after(async () => {

    await Db.disconnect();
    await MockDb.stop();

  });

  beforeEach( async () => {

    this.sandbox = createSandbox();
    await MockDb.reset();
    this.socialConnector = new Twitter({
      consumerKey: 'consumerKey',
      consumerSecret: 'consumerSecret',
      accessTokenKey: 'accessTokenKey',
      accessTokenSecret: 'accessTokenSecret'
    });

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should create instance', () => {

    const twitter = new Twitter({
      consumerKey: 'consumerKey',
      consumerSecret: 'consumerSecret',
      accessTokenKey: 'accessTokenKey',
      accessTokenSecret: 'accessTokenSecret'
    });

    expect(twitter.socialId).to.be.null;
    expect(twitter.client).to.be.an.instanceof(Twit);
    expect(twitter.limitedGetFollowers).to.exist;
    expect(twitter.limitedUploadPhoto).to.exist;
    expect(twitter.limitedUploadPhoto).to.exist;
    expect(twitter.initilized).to.be.false;

  });

  it('Cannot create instance without all credentials', () => {

    expect(() => new Twitter() ).to.throw('invalid_credentials');
    expect(() => new Twitter({}) ).to.throw('invalid_credentials');
    expect(() => new Twitter({ consumerKey: 'consumerKey'}) ).to.throw('invalid_credentials');
    expect(() => new Twitter({ consumerSecret: 'consumerSecret'}) ).to.throw('invalid_credentials');
    expect(() => new Twitter({ accessTokenKey: 'accessTokenKey'}) ).to.throw('invalid_credentials');
    expect(() => new Twitter({ accessTokenSecret: 'accessTokenSecret'}) ).to.throw('invalid_credentials');

  });

  it('Cannot call methods without initialize', async () => {

    const asyncMethods = [
      'getNewFollowers',
      'publish'
    ];

    await Promise.all(asyncMethods.map(method =>
      expect(this.socialConnector[method]() ).to.be.rejectedWith(Error, 'uninitialized_account')
    ) );
  });

  describe('Initialize', () => {

    beforeEach( () => {

      this.stubGet = this.sandbox.stub(this.socialConnector.client, 'getAsync');

    });

    it('Should initialize', async () => {

      this.stubGet.resolves({
        screen_name: 'screen_name',
        id: 'twitter_id'
      });

      await this.socialConnector.init();
      expect(this.stubGet.calledOnce).to.be.true;
      expect(this.stubGet.calledWith('account/verify_credentials') ).to.be.true;
      expect(this.socialConnector.initilized).to.be.true;
      expect(this.socialConnector.socialId).to.be.eq('twitter_id');

    });

    it('Cannot initialize if login failed', async () => {

      this.stubGet.rejects(new Error('fake-error-login') );

      await expect(this.socialConnector.init() ).to.be.rejectedWith(Error, 'fake-error-login');

    });

    it('Cannot initialize with invalid user', async () => {

      this.stubGet.resolves({
        screen_name: 'screen_name'
      });

      await expect(this.socialConnector.init() ).to.be.rejectedWith(Error, 'invalid_user');
      expect(this.stubGet.calledOnce).to.be.true;

      this.stubGet.resolves({
        id: 'id'
      });
      await expect(this.socialConnector.init() ).to.be.rejectedWith(Error, 'invalid_user');

    });

  });

  describe('With initialized account', () => {

    beforeEach( async () => {

      this.stubGet = this.sandbox.stub(this.socialConnector.client, 'getAsync').resolves({
        screen_name: 'screen_name',
        id: 'twitter_id'
      });
      this.stubUploadPhoto = this.sandbox.stub(this.socialConnector, 'limitedUploadPhoto');
      this.stubUploadPhotoTweet = this.sandbox.stub(this.socialConnector, 'limitedUploadPhotoTweet');

      await this.socialConnector.init();

    });

    describe('NewFollowers', () => {

      beforeEach( () => {

        this.stubGetFollowers = this.sandbox.stub(this.socialConnector, 'limitedGetFollowers');

      });

      it('Should get only new followers with one page', async () => {

        this.stubGetFollowers.resolves({
          users: [
            {
              id: 'id1',
              screen_name: 'username1'
            },
            {
              id: 'id2',
              screen_name: 'username2'
            }
          ],
          next_cursor: 0
        });

        const followers = await this.socialConnector.getNewFollowers();

        expect(this.stubGetFollowers.calledOnce).to.be.true;
        expect(this.stubGetFollowers.calledWith('followers/list', {
          count: 200,
          skip_status: true,
          cursor: -1
        }) ).to.be.true;
        expect(followers.length).to.be.eq(2);
        expect(followers[0]).to.be.deep.eq({
          socialId: 'id1',
          username: 'username1'
        });
        expect(followers[1]).to.be.deep.eq({
          socialId: 'id2',
          username: 'username2'
        });

      });

      it('Should get new and existing followers with one page', async () => {

        const follower = new Follower({
          socialId: 'id1',
          username: 'username',
        });

        await follower.save();
        this.stubGetFollowers.resolves({
          users: [
            {
              id: follower.socialId,
              screen_name: follower.username
            },
            {
              id: 'id2',
              screen_name: 'username2'
            }
          ],
          next_cursor: 0
        });

        const followers = await this.socialConnector.getNewFollowers();

        expect(this.stubGetFollowers.calledOnce).to.be.true;
        expect(this.stubGetFollowers.calledWith('followers/list', {
          count: 200,
          skip_status: true,
          cursor: -1
        }) ).to.be.true;
        expect(followers.length).to.eq(1);
        expect(followers[0]).to.be.deep.eq({
          socialId: 'id2',
          username: 'username2'
        });

      });

      it('Should get existing followers with one page', async () => {

        const follower = new Follower({
          socialId: 'id1',
          username: 'username',
        });

        const follower2 = new Follower({
          socialId: 'id2',
          username: 'username2',
        });

        await follower.save();
        await follower2.save();

        this.stubGetFollowers.resolves({
          users: [
            {
              id: follower.socialId,
              screen_name: follower.username
            },
            {
              id: follower2.socialId,
              screen_name: follower2.username
            }
          ],
          next_cursor: 0
        });

        const followers = await this.socialConnector.getNewFollowers();

        expect(this.stubGetFollowers.calledOnce).to.be.true;
        expect(followers.length).to.eq(0);

      });

      it('Should get only new followers with multiple pages and stop at the last page', async () => {

        this.stubGetFollowers.onFirstCall().resolves({
          users: [
            {
              id: 'id1',
              screen_name: 'username',
            },
            {
              id: 'id2',
              screen_name: 'username2',
            }
          ],
          next_cursor: 'next_cursor'
        });

        this.stubGetFollowers.onSecondCall().resolves({
          users: [
            {
              id: 'id3',
              screen_name: 'username3',
            },
            {
              id: 'id4',
              screen_name: 'username4',
            }
          ],
          next_cursor: 0
        });

        const followers = await this.socialConnector.getNewFollowers();

        expect(this.stubGetFollowers.callCount).to.be.eq(2);
        expect(this.stubGetFollowers.args[0][0]).to.be.deep.eq('followers/list', {
          count: 200,
          skip_status: true,
          cursor: -1
        });
        expect(this.stubGetFollowers.args[1][0]).to.be.deep.eq('followers/list', {
          count: 200,
          skip_status: true,
          cursor: 'next_cursor'
        });

        expect(followers.length).to.eq(4);
        expect(followers[0]).to.be.deep.eq({
          socialId: 'id1',
          username: 'username'
        });
        expect(followers[3]).to.be.deep.eq({
          socialId: 'id4',
          username: 'username4'
        });

      });

      it('Should get new followers and existing at the beginning with multiple pages and stop at the end', async () => {

        const follower = new Follower({
          socialId: 'id1',
          username: 'username',
        });

        await follower.save();

        this.stubGetFollowers.onFirstCall().resolves({
          users: [
            {
              id: follower.socialId,
              screen_name: follower.username
            },
            {
              id: 'id2',
              screen_name: 'username2',
            }
          ],
          next_cursor: 'next_cursor'
        });

        this.stubGetFollowers.onSecondCall().resolves({
          users: [
            {
              id: 'id3',
              screen_name: 'username3',
            },
            {
              id: 'id4',
              screen_name: 'username4',
            }
          ],
          next_cursor: 0
        });

        const followers = await this.socialConnector.getNewFollowers();

        expect(this.stubGetFollowers.callCount).to.be.eq(2);
        expect(followers.length).to.eq(3);
        expect(followers[0]).to.be.deep.eq({
          socialId: 'id2',
          username: 'username2'
        });
        expect(followers[2]).to.be.deep.eq({
          socialId: 'id4',
          username: 'username4'
        });

      });

      it('Should get new followers and existing at the end with multiple pages and stop at the end', async () => {

        const follower = new Follower({
          socialId: 'id4',
          username: 'username4',
        });
        const user2 = new Follower({
          socialId: 'id3',
          username: 'username3',
        });

        await follower.save();
        await user2.save();

        this.stubGetFollowers.onFirstCall().resolves({
          users: [
            {
              id: 'id1',
              screen_name: 'username',
            },
            {
              id: 'id2',
              screen_name: 'username2',
            }
          ],
          next_cursor: 'next_cursor'
        });

        this.stubGetFollowers.onSecondCall().resolves({
          users: [
            {
              id: 'id3',
              screen_name: 'username3',
            },
            {
              id: 'id4',
              screen_name: 'username4',
            }
          ],
          next_cursor: 0
        });

        const followers = await this.socialConnector.getNewFollowers();

        expect(this.stubGetFollowers.callCount).to.be.eq(2);
        expect(followers.length).to.eq(2);
        expect(followers[0]).to.be.deep.eq({
          socialId: 'id1',
          username: 'username'
        });
        expect(followers[1]).to.be.deep.eq({
          socialId: 'id2',
          username: 'username2'
        });

      });

      it('Should get new followers and existing with multiple pages and stop with no new in one page', async () => {

        const follower = new Follower({
          socialId: 'id4',
          username: 'username4',
        });

        await follower.save();

        this.stubGetFollowers.onFirstCall().resolves({
          users: [
            {
              id: 'id1',
              screen_name: 'username',
            },
            {
              id: 'id2',
              screen_name: 'username2',
            }
          ],
          next_cursor: 'next_cursor'
        });

        this.stubGetFollowers.onSecondCall().resolves({
          users: [
            {
              id: 'id3',
              screen_name: 'username3',
            },
            {
              id: 'id4',
              screen_name: 'username4',
            }
          ],
          next_cursor: 0
        });

        const followers = await this.socialConnector.getNewFollowers();

        expect(this.stubGetFollowers.callCount).to.be.eq(2);
        expect(followers.length).to.eq(3);
        expect(followers[0]).to.be.deep.eq({
          socialId: 'id1',
          username: 'username'
        });
        expect(followers[2]).to.be.deep.eq({
          socialId: 'id3',
          username: 'username3'
        });

      });

    });

    it('Should publish', async () => {

      this.stubUploadPhoto.resolves({
        media_id_string: 'media_id_string'
      });

      this.stubUploadPhotoTweet.resolves({
        id: 'id'
      });

      const res = await this.socialConnector.publish('./outputs/out_id.jpg', 'username');
      expect(res).to.be.true;

      expect(this.stubUploadPhoto.calledOnce).to.be.true;
      expect(this.stubUploadPhoto.calledWith('media/upload', {
        media: './outputs/out_id.jpg',
      }) ).to.be.true;

      expect(this.stubUploadPhotoTweet.calledOnce).to.be.true;
      expect(this.stubUploadPhotoTweet.calledWith('statuses/update', {
        status: 'ok @username',
        media_ids: 'media_id_string'
      }) ).to.be.true;

    });

    it('Should throw is upload file failed', async () => {

      this.stubUploadPhoto.resolves({});

      await expect(this.socialConnector.publish('./outputs/out_id.jpg', 'username') ).to.be.rejectedWith(Error, 'cannot_publish_media');

    });

    it('Should throw is tweet failed', async () => {

      this.stubUploadPhoto.resolves({
        media_id_string: 'media_id_string'
      });
      this.stubUploadPhotoTweet.resolves({});

      await expect(this.socialConnector.publish('./outputs/out_id.jpg', 'username') ).to.be.rejectedWith(Error, 'cannot_publish');

    });

  });

  describe.skip('Real calls', () => {

    it.skip('Should return followers in deterministic or after unfollow', async () => {

      const twitter = new Twitter({
        consumerKey: Config.socialConnectors.twitter.consumerKey,
        consumerSecret: Config.socialConnectors.twitter.consumerSecret,
        accessTokenKey: Config.socialConnectors.twitter.accessTokenKey,
        accessTokenSecret: Config.socialConnectors.twitter.accessTokenSecret,
      });

      await twitter.init();

      const followers = await twitter.getNewFollowers();
      logger.info('followers', { followers });

    });

    it.skip('Should publish', async () => {

      const twitter = new Twitter({
        consumerKey: Config.socialConnectors.twitter.consumerKey,
        consumerSecret: Config.socialConnectors.twitter.consumerSecret,
        accessTokenKey: Config.socialConnectors.twitter.accessTokenKey,
        accessTokenSecret: Config.socialConnectors.twitter.accessTokenSecret,
      });

      const photo = fs.readFileSync(`${Config.image.outputsDir}/out.jpg`);
      await twitter.init();

      const followers = await twitter.publish(photo, 'JulesGoullee');
      logger.info('followers', { followers });

    });

  });

});
