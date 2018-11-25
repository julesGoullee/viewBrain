const path = require('path');

const Config = require(path.join(srcDir, '../config') );
const Utils = require(path.join(srcDir, '/utils') );
const Db = require(path.join(srcDir, '/app/db') );
const Handler = require(path.join(srcDir, '/app/handler') );
const Instagram = require(path.join(srcDir, '/app/instagram') );
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
    this.restoreConfigInstagramUsername = Config.instagram.username;
    this.restoreConfigInstagramPassword = Config.instagram.password;
    Config.instagram.username = 'username';
    Config.instagram.password = 'password';
    this.stubInstagramInit = this.sandbox.stub(Instagram.prototype, 'init').resolves();
    this.stubDbConnect = this.sandbox.stub(Db, 'connect').resolves();
    this.stubHandleRun = this.sandbox.stub(Handler.prototype, 'run');
    await MockDb.reset();

  });

  afterEach( () => {

    Config.instagram.username = this.restoreConfigInstagramUsername;
    Config.instagram.password = this.restoreConfigInstagramPassword;
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
    expect(this.stubInstagramInit.calledOnce).to.be.true;
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
