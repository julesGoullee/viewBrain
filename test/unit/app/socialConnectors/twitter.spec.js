const path = require('path');
const sinon = require('sinon');
const Twit = require('twitter');
const fs = require('fs');
const MockDb = require(path.join(srcDir, '../test/mockDb') );

const Config = require(path.join(srcDir, '../config') );
const { logger, wait } = require(path.join(srcDir, '/utils') );

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

    this.sandbox = sinon.createSandbox();
    await MockDb.reset();
    this.twitter = new Twitter({
      consumerKey: 'consumerKey',
      consumerSecret: 'consumerSecret',
      accessTokenKey: 'accessTokenKey',
      accessTokenSecret: 'accessTokenSecret',
      tags: Config.tagWatcher.tags
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
      accessTokenSecret: 'accessTokenSecret',
      tags: Config.tagWatcher.tags
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
      'publish',
      'follow',
      'unfollow'
    ];

    const syncMethods = [ 'onNewPost' ];

    await Promise.all(asyncMethods.map(method =>
      expect(this.twitter[method]() ).to.be.rejectedWith(Error, 'uninitialized_account')
    ) );
    syncMethods.forEach((method) => {

      expect( () => this.twitter[method]() ).to.be.throws(Error, 'uninitialized_account');

    });

  });

  describe('Initialize', () => {

    beforeEach( () => {

      this.stubGet = this.sandbox.stub(this.twitter.client, 'getAsync');

    });

    it('Should initialize', async () => {

      this.stubGet.resolves({
        screen_name: 'screen_name',
        id: 'twitter_id'
      });

      await this.twitter.init();
      expect(this.stubGet.calledOnce).to.be.true;
      expect(this.stubGet.calledWith('account/verify_credentials') ).to.be.true;
      expect(this.twitter.initilized).to.be.true;
      expect(this.twitter.socialId).to.be.eq('twitter_id');

    });

    it('Cannot initialize if login failed', async () => {

      this.stubGet.rejects(new Error('fake-error-login') );

      await expect(this.twitter.init() ).to.be.rejectedWith(Error, 'fake-error-login');

    });

    it('Cannot initialize with invalid user', async () => {

      this.stubGet.resolves({
        screen_name: 'screen_name'
      });

      await expect(this.twitter.init() ).to.be.rejectedWith(Error, 'invalid_user');
      expect(this.stubGet.calledOnce).to.be.true;

      this.stubGet.resolves({
        id: 'id'
      });
      await expect(this.twitter.init() ).to.be.rejectedWith(Error, 'invalid_user');

    });

  });

  describe('With initialized account', () => {

    beforeEach( async () => {

      this.stubGet = this.sandbox.stub(this.twitter.client, 'getAsync').resolves({
        screen_name: 'screen_name',
        id: 'twitter_id'
      });
      this.stubUploadPhoto = this.sandbox.stub(this.twitter, 'limitedUploadPhoto');
      this.stubUploadPhotoTweet = this.sandbox.stub(this.twitter, 'limitedUploadPhotoTweet');
      this.stubStream = this.sandbox.stub(this.twitter.client, 'stream');
      this.stubFollow = this.sandbox.stub(this.twitter, 'limitedFollow');
      this.stubUnfollow = this.sandbox.stub(this.twitter, 'limitedUnfollow');
      this.stubFsRead = this.sandbox.stub(fs, 'readFileSync');
      await this.twitter.init();

    });

    describe('NewFollowers', () => {

      beforeEach( () => {

        this.stubGetFollowers = this.sandbox.stub(this.twitter, 'limitedGetFollowers');

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

        const followers = await this.twitter.getNewFollowers();

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

        const followers = await this.twitter.getNewFollowers();

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

        const followers = await this.twitter.getNewFollowers();

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

        const followers = await this.twitter.getNewFollowers();

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

        const followers = await this.twitter.getNewFollowers();

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

        const followers = await this.twitter.getNewFollowers();

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

        const followers = await this.twitter.getNewFollowers();

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

      this.stubFsRead.returns('out_id_data_png');
      this.stubUploadPhoto.resolves({
        media_id_string: 'media_id_string'
      });

      this.stubUploadPhotoTweet.resolves({
        id: 'id'
      });

      const res = await this.twitter.publish('./outputs/out_id.jpg', 'username');
      expect(res).to.be.true;

      expect(this.stubFsRead.calledOnce).to.be.true;
      expect(this.stubFsRead.calledWith('./outputs/out_id.jpg') ).to.be.true;
      expect(this.stubUploadPhoto.calledOnce).to.be.true;
      expect(this.stubUploadPhoto.calledWith('media/upload', {
        media: 'out_id_data_png',
      }) ).to.be.true;

      expect(this.stubUploadPhotoTweet.calledOnce).to.be.true;
      expect(this.stubUploadPhotoTweet.calledWith('statuses/update', {
        status: `Bam! Enjoy @username! 🤖 ${this.twitter.contentTags}`,
        media_ids: 'media_id_string'
      }) ).to.be.true;

    });

    it('Should throw is upload file failed', async () => {

      this.stubUploadPhoto.resolves({});

      await expect(this.twitter.publish('./outputs/out_id.jpg', 'username') ).to.be.rejectedWith(Error, 'cannot_publish_media');

    });

    it('Should throw is tweet failed', async () => {

      this.stubUploadPhoto.resolves({
        media_id_string: 'media_id_string'
      });
      this.stubUploadPhotoTweet.resolves({});

      await expect(this.twitter.publish('./outputs/out_id.jpg', 'username') ).to.be.rejectedWith(Error, 'cannot_publish');

    });

    it('Should stream new post', async () => {

      const stubStream = {
        on: this.sandbox.stub(),
        destroy: this.sandbox.stub()
      };
      const stubHandler = this.sandbox.stub();
      const stubLogger = this.sandbox.stub(logger, 'error');

      this.stubStream.returns(stubStream);

      const stop = this.twitter.onNewPost(stubHandler);

      expect(this.stubStream.calledOnce).to.be.true;
      expect(this.stubStream.calledWith('statuses/filter', { track: this.twitter.tagTrack }) ).to.be.true;

      expect(stubStream.on.callCount).to.be.eq(2);
      expect(stubStream.on.args[0][0]).to.be.eq('data');
      expect(stubStream.on.args[1][0]).to.be.eq('error');
      expect(stubHandler.callCount).to.be.eq(0);

      stubStream.on.args[0][1]({
        extended_tweet: {
          full_text: '#creative text'
        },
        user: {
          id: 'id',
          screen_name: 'screen_name'
        }
      });

      expect(stubHandler.calledOnce).to.be.true;
      expect(stubHandler.calledWith({
        user: {
          socialId: 'id',
          username: 'screen_name'
        },
        tag: 'creative'
      }) ).to.be.true;

      expect(stubLogger.callCount).to.be.eq(0);

      stubStream.on.args[1][1]({});
      expect(stubLogger.calledOnce).to.be.true;
      expect(stubLogger.calledWith('error on new post') ).to.be.true;

      expect(stubStream.destroy.callCount).to.be.eq(0);

      stop();

      expect(stubStream.destroy.calledOnce).to.be.true;

    });

    it('Should stream catch no content', async () => {

      const stubStream = {
        on: this.sandbox.stub(),
        destroy: this.sandbox.stub()
      };
      const stubHandler = this.sandbox.stub();
      const stubLogger = this.sandbox.stub(logger, 'error');

      this.stubStream.returns(stubStream);

      const stop = this.twitter.onNewPost(['tag1', 'tag2'], stubHandler);

      stubStream.on.args[0][1]({
        extended_tweet: {},
        user: {
          id: 'id',
          screen_name: 'screen_name'
        }
      });
      expect(stubHandler.callCount).to.be.eq(0);
      stubStream.on.args[0][1]({
        user: {
          id: 'id',
          screen_name: 'screen_name'
        }
      });
      expect(stubHandler.callCount).to.be.eq(0);

      stubStream.on.args[0][1]({
        extended_tweet: {
          full_text: '#tag3 text'
        },
        user: {
          id: 'id',
          screen_name: 'screen_name'
        }
      });
      expect(stubHandler.callCount).to.be.eq(0);
      expect(stubLogger.callCount).to.be.eq(0);

      stop();

    });

    it('Should follow', async () => {

      this.stubFollow.resolves({
        id: 'id'
      });
      await this.twitter.follow('username');
      expect(this.stubFollow.calledOnce).to.be.true;
      expect(this.stubFollow.calledWith('friendships/create', {
        screen_name: 'username',
      }) ).to.be.true;

    });

    it('Cannot follow with invalid response', async () => {

      this.stubFollow.resolves({});
      await expect(this.twitter.follow('username') ).to.be.rejectedWith(Error, 'cannot_follow');

    });

    it('Should unfollow', async () => {

      this.stubUnfollow.resolves({
        id: 'id'
      });
      await this.twitter.unfollow('username');
      expect(this.stubUnfollow.calledOnce).to.be.true;
      expect(this.stubUnfollow.calledWith('friendships/destroy', {
        screen_name: 'username',
      }) ).to.be.true;

    });

    it('Cannot unfollow with removed user', async () => {

      this.stubUnfollow.rejects([ new Error(Twitter.removeErrorMessage) ]);
      await this.twitter.unfollow('username');
      expect(this.stubUnfollow.calledWith('friendships/destroy', {
        screen_name: 'username',
      }) ).to.be.true;

    });

    it('Cannot unfollow with invalid response', async () => {

      this.stubUnfollow.resolves({});
      await expect(this.twitter.unfollow('username') ).to.be.rejectedWith(Error, 'cannot_unfollow');

    });

    it('Cannot catch error', async () => {

      this.stubUnfollow.rejects(new Error('fake-error') );
      await expect(this.twitter.unfollow('username') ).to.be.rejectedWith(Error, 'fake-error');

      this.stubUnfollow.rejects([new Error('fake-error') ]);
      await expect(this.twitter.unfollow('username') ).to.be.rejectedWith(Error, 'fake-error');


    });

  });

  describe.skip('Real calls', () => {

    beforeEach( async () => {

      this.twitter = new Twitter({
        consumerKey: Config.socialConnectors.twitter.consumerKey,
        consumerSecret: Config.socialConnectors.twitter.consumerSecret,
        accessTokenKey: Config.socialConnectors.twitter.accessTokenKey,
        accessTokenSecret: Config.socialConnectors.twitter.accessTokenSecret,
        tags: Config.tagWatcher.tags
      });
      await this.twitter.init();

    });

    it.skip('Should return followers in deterministic or after unfollow', async () => {

      const followers = await this.twitter.getNewFollowers();
      logger.info('followers', { followers });

    });

    it.skip('Should publish', async () => {

      const photo = fs.readFileSync(`${Config.image.outputsDir}/out.jpg`);

      const followers = await this.twitter.publish(photo, 'JulesGoullee');
      logger.info('followers', { followers });

    });

    it.skip('Should stream new post', async () => {

      const stop = this.twitter.onNewPost((post) => {

        logger.info('post', { post });

      });

      await wait(10000);

      stop();

    });

    it.skip('Should follow', async () => {

      await this.twitter.follow('JulesGoullee');

    });

    it.skip('Should unfollow', async () => {

      await this.twitter.unfollow('JulesGoullee');

    });

  });

});
