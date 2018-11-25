const path = require('path');

const Utils = require(path.join(srcDir, '/utils') );
const Db = require(path.join(srcDir, '/app/db') );
const Model = require(path.join(srcDir, '/image/model') );
const Render = require(path.join(srcDir, '/image/render') );
const Instagram = require(path.join(srcDir, 'app/instagram') );
const Handler = require(path.join(srcDir, 'app/handler') );
const Follower = require(path.join(srcDir, '/app/follower') );
const Jpg = require(path.join(srcDir, '/image/jpg') );

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
    this.instagram = new Instagram({
      username: 'instagram_username',
      password: 'instagram_password'
    });

    this.stubInstagramGetNewFollowers = this.sandbox.stub(this.instagram, 'getNewFollowers');
    this.stubInstagramPublish = this.sandbox.stub(this.instagram, 'publish');

    this.stubModelGenerate = this.sandbox.stub(Model.prototype, 'generate').returns('dataImg');
    this.stubRenderDraw = this.sandbox.stub(Render.prototype, 'draw').resolves();
    this.stubViewerRm = this.sandbox.stub(Jpg.prototype, 'rm').resolves();
    this.stubViewerGetPath = this.sandbox.stub(Jpg.prototype, 'getPath').returns('path');
    this.handler = new Handler({ instagram: this.instagram });

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should get render', async () => {

    const res = await Handler.getRender('instagramId');
    expect(res).to.be.an.instanceOf(Render);

    expect(this.stubModelGenerate.calledOnce).to.be.true;
    expect(this.stubRenderDraw.calledOnce).to.be.true;
    expect(this.stubRenderDraw.calledWith('dataImg', 'instagramId') ).to.be.true;

  });

  it('Should run', async () => {

    const stubHandleOne = this.sandbox.stub(this.handler, 'handleOne');
    const stubWait = this.sandbox.stub(Utils, 'wait');

    this.stubInstagramGetNewFollowers.resolves([
      {
        instagramId: 'instagramId',
        username: 'username'
      },
      {
        instagramId: 'instagramId1',
        username: 'username1'
      }
    ]);

    await this.handler.run();

    const followers = await Follower.find();

    expect(stubWait.callCount).to.be.eq(2);
    expect(stubHandleOne.callCount).to.be.eq(2);
    expect(stubHandleOne.args[0][0]).to.be.an.instanceOf(Follower);
    expect(stubHandleOne.args[0][0].instagramId).to.be.eq('instagramId');
    expect(followers.length).to.be.eq(2);

  });

  describe('With follower', () => {

    beforeEach( async () => {

      this.follower = new Follower({
        instagramId: 'instagramId',
        username: 'username'
      });

      await this.follower.save();

    });

    it('Should handle one', async () => {

      const spyGetRender = this.sandbox.spy(Handler, 'getRender');
      await this.handler.handleOne(this.follower);

      expect(spyGetRender.calledOnce).to.be.true;
      expect(this.stubInstagramPublish.calledOnce).to.be.true;

      expect(this.stubViewerGetPath.calledOnce).to.be.true;
      expect(this.stubViewerGetPath.calledWith(this.follower.instagramId) ).to.be.true;

      expect(this.stubInstagramPublish.calledWith('path'), this.follower.username).to.be.true;

      expect(this.stubViewerRm.calledOnce).to.be.true;
      expect(this.stubViewerRm.calledWith(this.follower.instagramId) ).to.be.true;

      expect(this.follower.status).to.be.eq('uploaded');

    });

  });

});
