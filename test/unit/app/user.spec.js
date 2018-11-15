const path = require('path');

const Db = require(path.join(srcDir, 'app/db') );
const User = require(path.join(srcDir, 'app/user') );

describe('User', () => {

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

    this.user = new User({
      instagramId: 'instagramId',
      username: 'username'
    });

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should find present user', async () => {

    await this.user.save();
    const userPresent = await User.isPresent({ instagramId: 'instagramId' });
    expect(userPresent).to.be.true;

  });

  it('Should not find missing user', async () => {

    const userPresent = await User.isPresent({ instagramId: 'instagramId' });
    expect(userPresent).to.be.false;

  });

});
