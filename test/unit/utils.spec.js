const path = require('path');

const Utils = require(path.join(srcDir, '/utils') );

describe('Utils', () => {

  beforeEach(async () => {

    this.sandbox = createSandbox();

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should find is node or not', () => {

    const startTitle = process.title;

    expect(Utils.isNode() ).to.be.true;

    process.title = 'browser';

    expect(Utils.isNode() ).to.be.false;

    process.title = startTitle;

  });

  it('Should wait', async () => {

    let end = false;

    setTimeout(() => {
      expect(end).to.be.false;
    }, 300);

    setTimeout(() => {
      expect(end).to.be.true;
    }, 600);

    const res = await Utils.wait(500).then(() => {
      end = true;
      return true;
    }).catch(error => Utils.logger.error(error));

    expect(res).to.be.true;
    await Utils.wait(200);

  });

  it('Should run infinite loop', async () => {

    let count = 0;
    let stopFct = null;

    const fn = this.sandbox.stub().callsFake(() => {

      count++;

      if(count === 2){

        stopFct();

      }

      return Promise.resolve();

    });

    stopFct = Utils.infiniteLoop(fn);

    await Utils.wait(500);

    expect(fn.callCount).to.be.eq(2);

  });

  it('Should catch infinite loop error', async () => {

    const stubError = this.sandbox.stub(Utils.logger, 'error');
    let stopFct = null;
    const fn = this.sandbox.stub().callsFake(() => {

      if(stopFct){

        stopFct();
        return Promise.reject('fake-error');

      }

      return Promise.resolve();

    });

    stopFct = Utils.infiniteLoop(fn);
    await Utils.wait(100);
    expect(stubError.calledWith('fake-error') ).to.be.true;


  });

  it('Should catch with custom handler infinite loop error', async () => {

    const stubError = this.sandbox.stub(Utils.logger, 'error');
    const onError = this.sandbox.stub();

    let stopFct = null;
    const fn = this.sandbox.stub().callsFake(() => {

      if(stopFct){

        stopFct();
        return Promise.reject('fake-error');

      }

      return Promise.resolve();

    });

    stopFct = Utils.infiniteLoop(fn, onError);
    await Utils.wait(100);

    expect(stubError.called).to.be.false;
    expect(onError.calledWith('fake-error') ).to.be.true;


  });

});
