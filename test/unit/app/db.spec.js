const path = require('path');

const Db = require(path.join(srcDir, '/app/db') );

describe('Db', () => {

  before(async () => {

    await MockDb.start();

  });

  after(async () => {

    await MockDb.stop();

  });

  beforeEach(async () => {

    this.sandbox = createSandbox();
    await MockDb.reset();

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should connect and disconnect', async () => {

    await Db.connect();
    expect(Db.isConnected() ).to.be.true;
    await Db.disconnect();
    expect(Db.isConnected() ).to.be.false;

  });

});
