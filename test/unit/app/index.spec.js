const path = require('path');

const MockSocialConnector = require('../../mocks/socialConnector');
const Utils = require(path.join(srcDir, '/utils') );
const Db = require(path.join(srcDir, '/app/db') );
const Handler = require(path.join(srcDir, '/app/handler') );
const SocialConnectors = require(path.join(srcDir, '/app/socialConnectors') );
const Run = require(path.join(srcDir, '/app/index') );

describe('Run', () => {

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
    this.SocialConnector = MockSocialConnector(this.sandbox);
    this.mockSocialConnector = new this.SocialConnector();
    this.stubSocialConnectorsInit = this.sandbox.stub(SocialConnectors, 'init').returns(this.mockSocialConnector);
    this.stubDbConnect = this.sandbox.stub(Db, 'connect').resolves();
    this.stubHandleRun = this.sandbox.stub(Handler.prototype, 'run');
    await MockDb.reset();

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should run', async () => {

    let count = 0;
    let stopper =  null;

    this.stubHandleRun.callsFake(() => {

      count++;

      if(count === 2){

        stopper();

      }

      return Promise.resolve();

    });

    stopper = await Run();
    await Utils.wait(500);

    expect(this.stubDbConnect.calledOnce).to.be.true;
    expect(this.stubSocialConnectorsInit.calledOnce).to.be.true;
    expect(this.stubHandleRun.callCount).to.be.eq(2);

  });

  it('Should catch global errors and disconnect db', async () => {

    const spyLoggerError = this.sandbox.spy(Utils.logger, 'error');
    const spyDbDisconnect = this.sandbox.spy(Db, 'disconnect');

    const stubStop = this.sandbox.stub();
    const stubInfiniteLoop = this.sandbox.stub(Utils, 'infiniteLoop').resolves(stubStop);

    this.stubDbConnect.rejects(new Error('fake-error') );

    await Run();
    expect(spyLoggerError.calledOnce).to.be.true;
    expect(spyLoggerError.args[0][0].message).to.be.eq('fake-error');
    expect(spyDbDisconnect.calledOnce).to.be.true;
    expect(stubInfiniteLoop.called).to.be.false;
    expect(stubStop.called).to.be.false;

  });

  it('Should catch errors in loop', async () => {

    const spyLoggerError = this.sandbox.spy(Utils.logger, 'error');
    const spyDbDisconnect = this.sandbox.spy(Db, 'disconnect');

    const spyInfiniteLoop = this.sandbox.spy(Utils, 'infiniteLoop');

    let count = 0;

    this.stubHandleRun.callsFake(() => {

      count++;

      if(count === 5){

        return Promise.reject(new Error('fake-error-1') );

      }

      return Promise.resolve();

    });

    await Run();

    await Utils.wait(500);

    expect(spyLoggerError.calledOnce).to.be.true;
    expect(spyLoggerError.args[0][0].message).to.be.eq('fake-error-1');
    expect(spyDbDisconnect.calledOnce).to.be.true;
    expect(spyInfiniteLoop.calledOnce).to.be.true;

  });

});
