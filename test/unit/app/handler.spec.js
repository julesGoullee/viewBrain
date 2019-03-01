const path = require('path');

const MockSocialConnector = require('../../mocks/socialConnector');
const Utils = require(path.join(srcDir, '/utils') );
const Db = require(path.join(srcDir, '/app/db') );
const Model = require(path.join(srcDir, '/image/model') );
const Render = require(path.join(srcDir, '/image/render') );
const Jpg = require(path.join(srcDir, '/image/jpg') );
const Handler = require(path.join(srcDir, 'app/handler') );
const Follower = require(path.join(srcDir, '/app/follower') );

describe('Handler', () => {

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

    this.stubModelGenerate = this.sandbox.stub(Model.prototype, 'generate').returns('dataImg');
    this.stubRenderDraw = this.sandbox.stub(Render.prototype, 'draw').resolves();
    this.stubViewerRm = this.sandbox.stub(Jpg.prototype, 'rm').resolves();
    this.stubViewerGetPath = this.sandbox.stub(Jpg.prototype, 'getPath').returns('path');
    this.handler = new Handler({ socialConnector: this.mockSocialConnector });

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should get render', async () => {

    const res = await Handler.getRender('socialId');
    expect(res).to.be.an.instanceOf(Render);

    expect(this.stubModelGenerate.calledOnce).to.be.true;
    expect(this.stubRenderDraw.calledOnce).to.be.true;
    expect(this.stubRenderDraw.calledWith('dataImg', 'socialId') ).to.be.true;

  });

  it('Should run', async () => {

    const stubHandleOne = this.sandbox.stub(this.handler, 'handleOne');
    const stubWait = this.sandbox.stub(Utils, 'wait');

    this.mockSocialConnector.getNewFollowers.resolves([
      {
        socialId: 'socialId',
        username: 'username'
      },
      {
        socialId: 'socialId1',
        username: 'username1'
      }
    ]);

    await this.handler.run();

    const followers = await Follower.find();

    expect(stubWait.callCount).to.be.eq(2);
    expect(stubHandleOne.callCount).to.be.eq(2);
    expect(stubHandleOne.args[0][0]).to.be.an.instanceOf(Follower);
    expect(stubHandleOne.args[0][0].socialId).to.be.eq('socialId');
    expect(followers.length).to.be.eq(2);

  });

  describe('With follower', () => {

    beforeEach( async () => {

      this.follower = new Follower({
        socialId: 'socialId',
        username: 'username'
      });

      await this.follower.save();

    });

    it('Should handle one', async () => {

      const spyGetRender = this.sandbox.spy(Handler, 'getRender');
      await this.handler.handleOne(this.follower);

      expect(spyGetRender.calledOnce).to.be.true;
      expect(this.mockSocialConnector.publish.calledOnce).to.be.true;

      expect(this.stubViewerGetPath.calledOnce).to.be.true;
      expect(this.stubViewerGetPath.calledWith(this.follower.socialId) ).to.be.true;

      expect(this.mockSocialConnector.publish.calledWith('path'), this.follower.username).to.be.true;

      expect(this.stubViewerRm.calledOnce).to.be.true;
      expect(this.stubViewerRm.calledWith(this.follower.socialId) ).to.be.true;

      expect(this.follower.status).to.be.eq('uploaded');

    });

  });

});
