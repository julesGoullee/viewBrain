const path = require('path');
const moment = require('moment');

const MockSocialConnector = require('../../mocks/socialConnector');
const Config = require(path.join(srcDir, '../config') );
const Utils = require(path.join(srcDir, '/utils') );
const Db = require(path.join(srcDir, '/app/models/db') );
const TagWatcher = require(path.join(srcDir, 'app/tagWatcher') );
const Following = require(path.join(srcDir, '/app/models/following') );

describe('Tag watcher', () => {

  before(async () => {

    await MockDb.start();

    await Db.connect();

  });

  after(async () => {

    await Db.disconnect();
    await MockDb.stop();

  });

  beforeEach(async () => {

    this.sandbox = createSandbox();
    await MockDb.reset();
    this.SocialConnector = MockSocialConnector(this.sandbox);
    this.mockSocialConnector = new this.SocialConnector();
    this.tagWatcher = new TagWatcher({ socialConnector: this.mockSocialConnector, tags: this.tags });

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should create tag watcher', async () => {

    expect(this.tagWatcher.socialConnector).to.be.eq(this.mockSocialConnector);
    expect(this.tagWatcher.usersByTag).to.be.deep.eq(Config.tagWatcher.tags.reduce((acc, tag) => {

      acc[tag] = [];
      return acc;

    }, {}) );
    expect(this.tagWatcher.stopper).to.be.null;

  });

  it('Should sort best users', () => {

    expect(TagWatcher.sortBestUsers([
      { followers: 3 },
      { followers: 2 },
      { followers: 1 },
    ]) ).to.be.deep.eq([
      { followers: 3 },
      { followers: 2 },
      { followers: 1 },
    ]);

    expect(TagWatcher.sortBestUsers([
      { followers: 1 },
      { followers: 2 },
      { followers: 3 },
    ]) ).to.be.deep.eq([
      { followers: 3 },
      { followers: 2 },
      { followers: 1 },
    ]);

    expect(TagWatcher.sortBestUsers([
      { followers: 3 },
      { followers: 1 },
      { followers: 2 },
    ]) ).to.be.deep.eq([
      { followers: 3 },
      { followers: 2 },
      { followers: 1 },
    ]);

  });

  it('Should run', async () => {

    Config.tagWatcher.intervalFollow = '1000';
    const stubFollowBestUser = this.sandbox.stub(this.tagWatcher, 'followBestUsers');
    const stubUnfollowOldUser = this.sandbox.stub(this.tagWatcher, 'unfollowOldUser');
    const stubStopper = this.sandbox.stub();
    this.mockSocialConnector.onNewPost.returns(stubStopper);
    const stubLogger = this.sandbox.stub(Utils.logger, 'info');

    const promiseEnd = this.tagWatcher.run();

    expect(stubLogger.calledOnce).to.be.true;
    expect(stubLogger.calledWith('TagWatcher start', { service: 'tagWatcher' }) ).to.be.true;
    expect(this.tagWatcher.stopper).to.be.eq(stubStopper);
    expect(this.mockSocialConnector.onNewPost.calledOnce).to.be.true;

    expect(this.mockSocialConnector.onNewPost.calledWith(this.tagWatcher.onNewPost) ).to.be.true;

    Config.tagWatcher.tags.forEach(tag =>{

      this.tagWatcher.usersByTag[tag] = ['post1', 'post2'];

    });

    expect(stubStopper.callCount).to.be.eq(0);

    await promiseEnd;

    expect(stubStopper.calledOnce).to.be.true;
    expect(stubFollowBestUser.calledOnce).to.be.true;
    expect(stubUnfollowOldUser.calledOnce).to.be.true;
    expect(this.tagWatcher.stopper).to.be.null;
    expect(this.tagWatcher.usersByTag).to.be.deep.eq(Config.tagWatcher.tags.reduce( (acc, tag) => {

      acc[tag] = [];

      return acc;

    }, {}));

    expect(stubLogger.calledWith('TagWatcher finish', { service: 'tagWatcher' }) ).to.be.true;
    Config.tagWatcher.intervalFollow = '3600000';

  });

  it('Should handle new post', () => {

    this.tagWatcher.onNewPost({ tag: 'creative', user: 'user' });
    expect(this.tagWatcher.usersByTag.creative.length).to.be.eq(1);
    expect(this.tagWatcher.usersByTag.creative[0]).to.be.eq('user');

  });

  describe('followBestUsers', () => {

    it('Should follow best users with enough user in each tags', async () => {

      Config.tagWatcher.tags.forEach(tag => {

        for(let i = 0; i < Config.tagWatcher.userByTag; i++){

          this.tagWatcher.usersByTag[tag].push({
            socialId: `socialId_${tag}_${i}`,
            username: `username_${tag}_${i}`,
            followers: i + 1
          });

        }

      });

      await this.tagWatcher.followBestUsers();

      const followings = await Following.find();

      expect(this.mockSocialConnector.follow.callCount).to.be.eq(Config.tagWatcher.userByTag * Config.tagWatcher.tags.length);
      expect(this.mockSocialConnector.follow.args[0][0]).to.be.eq('username_abstractart_4');
      expect(followings.length).to.be.eq(Config.tagWatcher.userByTag * Config.tagWatcher.tags.length);

    });

    it('Should follow best users with more user in each tags', async () => {

      Config.tagWatcher.tags.forEach(tag => {

        for(let i = 0; i < parseInt(Config.tagWatcher.userByTag, 10) + 5; i++){

          this.tagWatcher.usersByTag[tag].push({
            socialId: `socialId_${tag}_${i}`,
            username: `username_${tag}_${i}`,
            followers: i + 1
          });

        }

      });

      await this.tagWatcher.followBestUsers();

      const followings = await Following.find();

      expect(this.mockSocialConnector.follow.callCount).to.be.eq(Config.tagWatcher.userByTag * Config.tagWatcher.tags.length);
      expect(this.mockSocialConnector.follow.args[0][0]).to.be.eq('username_abstractart_9');
      expect(followings.length).to.be.eq(Config.tagWatcher.userByTag * Config.tagWatcher.tags.length);

    });

    it('Should follow best users with less user in each tags', async () => {

      const nbPeerTag = parseInt(Config.tagWatcher.userByTag, 10) - 2;
      Config.tagWatcher.tags.forEach(tag => {

        for(let i = 0; i < nbPeerTag; i++){

          this.tagWatcher.usersByTag[tag].push({
            socialId: `socialId_${tag}_${i}`,
            username: `username_${tag}_${i}`,
            followers: i + 1
          });

        }

      });

      await this.tagWatcher.followBestUsers();

      const followings = await Following.find();

      expect(this.mockSocialConnector.follow.callCount).to.be.eq(nbPeerTag * Config.tagWatcher.tags.length);
      expect(this.mockSocialConnector.follow.args[0][0]).to.be.eq('username_abstractart_2');
      expect(followings.length).to.be.eq(nbPeerTag * Config.tagWatcher.tags.length);

    });


  });

  describe('unfollowOldUser', () => {

    it('Should unfollow old users', async () => {

      const following1 = new Following({
        socialId: 'socialId1',
        username: 'username1',
        createdAt: moment.utc().subtract(parseInt(Config.tagWatcher.timerUnfollow, 10) + 1, 'days').toDate()
      });
      const following2 = new Following({
        socialId: 'socialId2',
        username: 'username2',
        createdAt: moment.utc().subtract(parseInt(Config.tagWatcher.timerUnfollow, 10) + 1, 'days').toDate()
      });
      const following3 = new Following({
        socialId: 'socialId3',
        username: 'username3'
      });
      await following1.save();
      await following2.save();
      await following3.save();
      await this.tagWatcher.unfollowOldUser();
      expect(this.mockSocialConnector.unfollow.callCount).to.be.eq(2);
      expect(this.mockSocialConnector.unfollow.args[0][0].socialId).to.be.eq('socialId1');
      expect(this.mockSocialConnector.unfollow.args[1][0].socialId).to.be.eq('socialId2');

    });

  });

});
