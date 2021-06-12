const path = require('path');
const moment = require('moment');
const sinon = require('sinon');
const MockDb = require(path.join(srcDir, '../test/mockDb') );

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

    this.sandbox = sinon.createSandbox();
    await MockDb.reset();
    this.SocialConnector = MockSocialConnector(this.sandbox);
    this.mockSocialConnector = new this.SocialConnector();
    this.tagWatcher = new TagWatcher({ socialConnector: this.mockSocialConnector, tags: Config.tagWatcher.tags });

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should create tag watcher', async () => {

    expect(this.tagWatcher.socialConnector).to.be.eq(this.mockSocialConnector);
    expect(this.tagWatcher.usersBatch.length).to.be.eq(0);
    expect(this.tagWatcher.usersByTag).to.be.deep.eq(Config.tagWatcher.tags.reduce((acc, tag) => {

      acc[tag] = [];
      return acc;

    }, {}) );
    expect(this.tagWatcher.stopper).to.be.null;

  });

  describe('Sort users', () => {

    it('Should sort best users', async () => {

      expect(await TagWatcher.sortBestUsers([
        { socialId: 'socialId1', followers: 3 },
        { socialId: 'socialId2', followers: 2 },
        { socialId: 'socialId3', followers: 1 },
      ]) ).to.be.deep.eq([
        { socialId: 'socialId1', followers: 3 },
        { socialId: 'socialId2', followers: 2 },
        { socialId: 'socialId3', followers: 1 },
      ]);

      expect(await TagWatcher.sortBestUsers([
        { socialId: 'socialId1', followers: 1 },
        { socialId: 'socialId2', followers: 2 },
        { socialId: 'socialId3', followers: 3 },
      ]) ).to.be.deep.eq([
        { socialId: 'socialId3', followers: 3 },
        { socialId: 'socialId2', followers: 2 },
        { socialId: 'socialId1', followers: 1 },
      ]);

      expect(await TagWatcher.sortBestUsers([
        { socialId: 'socialId1', followers: 3 },
        { socialId: 'socialId2', followers: 1 },
        { socialId: 'socialId3', followers: 2 },
      ]) ).to.be.deep.eq([
        { socialId: 'socialId1', followers: 3 },
        { socialId: 'socialId3', followers: 2 },
        { socialId: 'socialId2', followers: 1 },
      ]);

    });

    it('Should sort users with more than config', async () => {

      const users = [];

      for(let i = 0; i < parseInt(Config.tagWatcher.userByTag, 10) + 1; i++){

        users.push({
          socialId: `socialId${i + 1}`,
          followers: i + 1
        });

      }

      expect(await TagWatcher.sortBestUsers(users) ).to.be.deep.eq(
        users.slice(-parseInt(Config.tagWatcher.userByTag, 10) ).reverse()
      );

    });

    it('Should sort users with existing user', async () => {

      const following1 = new Following({
        socialId: 'socialId3',
        username: 'username3',
        fromTag: 'tag1'
      });
      const following2 = new Following({
        socialId: 'socialId5',
        username: 'username5',
        fromTag: 'tag1'
      });

      await following1.save();
      await following2.save();

      expect(await TagWatcher.sortBestUsers([
        { socialId: 'socialId1', followers: 1 },
        { socialId: 'socialId2', followers: 2 },
        { socialId: 'socialId3', followers: 3 },
        { socialId: 'socialId4', followers: 4 },
        { socialId: 'socialId5', followers: 5 },
        { socialId: 'socialId6', followers: 6 },
        { socialId: 'socialId7', followers: 7 },
      ]) ).to.be.deep.eq([
        { socialId: 'socialId7', followers: 7 },
        { socialId: 'socialId6', followers: 6 },
        { socialId: 'socialId4', followers: 4 },
        { socialId: 'socialId2', followers: 2 },
        { socialId: 'socialId1', followers: 1 },
      ]);

    });

  });

  describe('Watch for following', () => {

    it('Should watch for following', async () => {

      Config.tagWatcher.intervalFollow = '1000';
      const stubFollowBestUser = this.sandbox.stub(this.tagWatcher, 'followBestUsers');
      const stubStopper = this.sandbox.stub();
      this.mockSocialConnector.onNewPost.returns(stubStopper);

      const promiseEnd = this.tagWatcher.watchForFollowing();

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
      expect(this.tagWatcher.stopper).to.be.null;
      expect(this.tagWatcher.usersByTag).to.be.deep.eq(Config.tagWatcher.tags.reduce( (acc, tag) => {

        acc[tag] = [];

        return acc;

      }, {}));
      expect(this.tagWatcher.usersBatch.length).to.be.eq(0);

      Config.tagWatcher.intervalFollow = '3600000';

    });

  });

  describe('Run', () => {

    it('Should run', async () => {

      const stubWatchForFollowing = this.sandbox.stub(this.tagWatcher, 'watchForFollowing');
      const stubUnfollowOldUser = this.sandbox.stub(this.tagWatcher, 'unfollowOldFollowing');
      const stubLogger = this.sandbox.stub(Utils.logger, 'info');

      await this.tagWatcher.run();

      expect(stubLogger.callCount).to.be.eq(2);
      expect(stubLogger.calledWith('TagWatcher start', { service: 'tagWatcher' }) ).to.be.true;
      expect(stubLogger.calledWith('TagWatcher finish', { service: 'tagWatcher' }) ).to.be.true;
      expect(stubWatchForFollowing.callCount).to.be.eq(0);
      expect(stubUnfollowOldUser.callCount).to.be.eq(0);

    });

    it('Should run with watch for following', async () => {

      Config.tagWatcher.watchForFollowing = true;
      const stubWatchForFollowing = this.sandbox.stub(this.tagWatcher, 'watchForFollowing');
      const stubUnfollowOldUser = this.sandbox.stub(this.tagWatcher, 'unfollowOldFollowing');
      const stubLogger = this.sandbox.stub(Utils.logger, 'info');

      await this.tagWatcher.run();

      expect(stubLogger.callCount).to.be.eq(2);
      expect(stubLogger.calledWith('TagWatcher start', { service: 'tagWatcher' }) ).to.be.true;
      expect(stubLogger.calledWith('TagWatcher finish', { service: 'tagWatcher' }) ).to.be.true;
      expect(stubWatchForFollowing.calledOnce).to.be.true;
      expect(stubUnfollowOldUser.callCount).to.be.eq(0);
      Config.tagWatcher.watchForFollowing = false;

    });

    it('Should run with unfollow old following', async () => {

      Config.tagWatcher.unfollowOldFollowing = true;
      const stubWatchForFollowing = this.sandbox.stub(this.tagWatcher, 'watchForFollowing');
      const stubUnfollowOldUser = this.sandbox.stub(this.tagWatcher, 'unfollowOldFollowing');
      const stubLogger = this.sandbox.stub(Utils.logger, 'info');

      await this.tagWatcher.run();

      expect(stubLogger.callCount).to.be.eq(2);
      expect(stubLogger.calledWith('TagWatcher start', { service: 'tagWatcher' }) ).to.be.true;
      expect(stubLogger.calledWith('TagWatcher finish', { service: 'tagWatcher' }) ).to.be.true;
      expect(stubWatchForFollowing.callCount).to.be.eq(0);
      expect(stubUnfollowOldUser.calledOnce).to.be.true;
      Config.tagWatcher.unfollowOldFollowing = false;

    });

    it('Should run with all', async () => {

      Config.tagWatcher.unfollowOldFollowing = true;
      Config.tagWatcher.watchForFollowing = true;
      const stubWatchForFollowing = this.sandbox.stub(this.tagWatcher, 'watchForFollowing');
      const stubUnfollowOldUser = this.sandbox.stub(this.tagWatcher, 'unfollowOldFollowing');
      const stubLogger = this.sandbox.stub(Utils.logger, 'info');

      await this.tagWatcher.run();

      expect(stubLogger.callCount).to.be.eq(2);
      expect(stubLogger.calledWith('TagWatcher start', { service: 'tagWatcher' }) ).to.be.true;
      expect(stubLogger.calledWith('TagWatcher finish', { service: 'tagWatcher' }) ).to.be.true;
      expect(stubWatchForFollowing.calledOnce).to.be.true;
      expect(stubUnfollowOldUser.calledOnce).to.be.true;

      Config.tagWatcher.watchForFollowing = false;
      Config.tagWatcher.unfollowOldFollowing = false;

    });

  });

  it('Should handle new post', () => {

    this.tagWatcher.onNewPost({ tag: 'creative', user: { socialId: 'socialId1'} });
    expect(this.tagWatcher.usersByTag.creative.length).to.be.eq(1);
    expect(this.tagWatcher.usersByTag.creative[0]).to.be.deep.eq({ socialId: 'socialId1'});
    expect(this.tagWatcher.usersBatch).to.be.deep.eq([{ socialId: 'socialId1'}]);

  });

  it('Should handle new post duplicated', () => {

    this.tagWatcher.onNewPost({ tag: 'creative', user: { socialId: 'socialId1'} });
    expect(this.tagWatcher.usersByTag.creative.length).to.be.eq(1);
    expect(this.tagWatcher.usersByTag.creative[0]).to.be.deep.eq({ socialId: 'socialId1'});
    expect(this.tagWatcher.usersBatch).to.be.deep.eq([{ socialId: 'socialId1'}]);

    this.tagWatcher.onNewPost({ tag: 'creative', user: { socialId: 'socialId1'} });
    expect(this.tagWatcher.usersByTag.creative.length).to.be.eq(1);
    expect(this.tagWatcher.usersBatch).to.be.deep.eq([{ socialId: 'socialId1'}]);

    this.tagWatcher.onNewPost({ tag: 'abstractart', user: { socialId: 'socialId1'} });
    expect(this.tagWatcher.usersByTag.creative.length).to.be.eq(1);
    expect(this.tagWatcher.usersBatch).to.be.deep.eq([{ socialId: 'socialId1'}]);

  });

  describe('followBestUsers', () => {

    it('Should follow best users', async () => {

      const spyFollowingSave = this.sandbox.spy(Following.prototype, 'save');
      const stubLoggerInfo = this.sandbox.stub(Utils.logger, 'info');

      Config.tagWatcher.tags.forEach(tag => {

        for(let i = 0; i < parseInt(Config.tagWatcher.userByTag, 10); i++){

          this.tagWatcher.usersByTag[tag].push({
            socialId: `socialId${tag}_${i}`,
            username: `username_${tag}_${i}`,
            fromTag: 'tag1',
            followers: i + 1
          });

        }

      });

      await this.tagWatcher.followBestUsers();

      const followings = await Following.find();

      expect(this.mockSocialConnector.follow.callCount).to.be.eq(Config.tagWatcher.userByTag * Config.tagWatcher.tags.length);
      expect(this.mockSocialConnector.follow.calledWith('username_abstractart_4') ).to.be.true;
      expect(spyFollowingSave.callCount).to.be.eq(Config.tagWatcher.userByTag * Config.tagWatcher.tags.length);

      expect(stubLoggerInfo.callCount).to.be.eq(Config.tagWatcher.userByTag * Config.tagWatcher.tags.length + 1);
      expect(stubLoggerInfo.args[0]).to.be.deep.eq([
        'FollowBestUsers',
        {
          service: 'tagWatcher',
          stats: Config.tagWatcher.tags.map(tag => ({ tag, count: parseInt(Config.tagWatcher.userByTag, 10)}) )
        }
      ]);
      expect(stubLoggerInfo.args[1][0]).to.be.eq('New following');
      expect(stubLoggerInfo.args[1][1].service).to.be.eq('tagWatcher');
      expect(stubLoggerInfo.args[1][1].username).to.exist;
      expect(stubLoggerInfo.args[1][1].fromTag).to.exist;

      expect(followings.length).to.be.eq(Config.tagWatcher.userByTag * Config.tagWatcher.tags.length);

    });

    it('Should catch error for one user', async () => {

      const stubLoggerError = this.sandbox.stub(Utils.logger, 'error');
      const stubLoggerInfo = this.sandbox.stub(Utils.logger, 'info');
      this.mockSocialConnector.follow.onSecondCall().rejects(new Error('fak-error') );
      const spyFollowingSave = this.sandbox.spy(Following.prototype, 'save');

      Config.tagWatcher.tags.forEach(tag => {

        for(let i = 0; i < Config.tagWatcher.userByTag; i++){

          this.tagWatcher.usersByTag[tag].push({
            socialId: `socialId${tag}_${i}`,
            username: `username_${tag}_${i}`,
            fromTag: 'tag1',
            followers: i + 1
          });

        }

      });

      await this.tagWatcher.followBestUsers();

      expect(stubLoggerError.calledOnce).to.be.true;
      expect(stubLoggerError.args[0][0]).to.be.eq('Cannot follow');
      expect(spyFollowingSave.callCount).to.be.eq(Config.tagWatcher.userByTag * Config.tagWatcher.tags.length -1);
      expect(stubLoggerInfo.callCount).to.be.eq(Config.tagWatcher.userByTag * Config.tagWatcher.tags.length);

    });

  });

  describe('unfollowOldFollowing', () => {

    it('Should unfollow old users', async () => {

      const spyFollowingUpdate = this.sandbox.spy(Following.prototype, 'updateOne');
      const stubLoggerInfo = this.sandbox.stub(Utils.logger, 'info');

      const following1 = new Following({
        socialId: 'socialId1',
        username: 'username1',
        fromTag: 'tag1',
        createdAt: moment.utc().subtract(parseInt(Config.tagWatcher.timerUnfollow, 10) + 1, 'days').toDate()
      });
      const following2 = new Following({
        socialId: 'socialId2',
        username: 'username2',
        fromTag: 'tag1',
        createdAt: moment.utc().subtract(parseInt(Config.tagWatcher.timerUnfollow, 10) + 1, 'days').toDate()
      });
      const following3 = new Following({
        socialId: 'socialId3',
        username: 'username3',
        fromTag: 'tag1'
      });
      await following1.save();
      await following2.save();
      await following3.save();

      await this.tagWatcher.unfollowOldFollowing();
      expect(this.mockSocialConnector.unfollow.callCount).to.be.eq(2);
      expect(this.mockSocialConnector.unfollow.args[0][0]).to.be.eq('username1');
      expect(this.mockSocialConnector.unfollow.args[1][0]).to.be.eq('username2');
      expect(spyFollowingUpdate.callCount).to.be.eq(2);

      expect(stubLoggerInfo.callCount).to.be.eq(2);
      await following1.reload();
      await following2.reload();

      await following1.reload();
      await following2.reload();
      await following3.reload();

      expect(following1.active).to.be.false;
      expect(following2.active).to.be.false;
      expect(following3.active).to.be.true;

    });

    it('Should catch error for one user', async () => {

      const spyFollowingUpdate = this.sandbox.spy(Following.prototype, 'updateOne');
      const stubLoggerError = this.sandbox.stub(Utils.logger, 'error');
      const stubLoggerInfo = this.sandbox.stub(Utils.logger, 'info');

      const following1 = new Following({
        socialId: 'socialId1',
        username: 'username1',
        fromTag: 'tag1',
        createdAt: moment.utc().subtract(parseInt(Config.tagWatcher.timerUnfollow, 10) + 1, 'days').toDate()
      });
      const following2 = new Following({
        socialId: 'socialId2',
        username: 'username2',
        fromTag: 'tag1',
        createdAt: moment.utc().subtract(parseInt(Config.tagWatcher.timerUnfollow, 10) + 1, 'days').toDate()
      });
      const following3 = new Following({
        socialId: 'socialId3',
        username: 'username3',
        fromTag: 'tag1'
      });
      await following1.save();
      await following2.save();
      await following3.save();

      this.mockSocialConnector.unfollow.onSecondCall().rejects(new Error('fake-error') );
      await this.tagWatcher.unfollowOldFollowing();

      expect(this.mockSocialConnector.unfollow.callCount).to.be.eq(2);
      expect(this.mockSocialConnector.unfollow.args[0][0]).to.be.eq('username1');
      expect(this.mockSocialConnector.unfollow.args[1][0]).to.be.eq('username2');
      expect(spyFollowingUpdate.callCount).to.be.eq(1);
      expect(stubLoggerError.callCount).to.be.eq(1);
      expect(stubLoggerError.args[0][0]).to.be.eq('Cannot unfollow');
      expect(stubLoggerError.args[0][1].username).to.be.eq('username2');

      expect(stubLoggerInfo.calledOnce).to.be.true;
      expect(stubLoggerInfo.args[0]).to.be.deep.eq([
        'Unfollow',
        {
          service: 'tagWatcher',
          username: 'username1',
          fromTag: 'tag1',
          createdAt: following1.createdAt.toISOString()
        }
      ]);

      await following1.reload();
      await following2.reload();
      await following3.reload();

      expect(following1.active).to.be.false;
      expect(following2.active).to.be.true;
      expect(following3.active).to.be.true;

    });

  });

});
