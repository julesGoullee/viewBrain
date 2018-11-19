const path = require('path');

const Db = require(path.join(srcDir, '/app/db') );
const Follower = require(path.join(srcDir, '/app/follower') );

describe('Follower', () => {

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

    this.follower = new Follower({
      instagramId: 'instagramId',
      username: 'username'
    });

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should add default value', async () => {

    await this.follower.save();

    const follower = await Follower.findOne({ instagramId: 'instagramId' });
    expect(follower.instagramId).to.be.eq('instagramId');
    expect(follower.username).to.be.eq('username');
    expect(follower.status).to.be.eq('pending');

  });

  it('Should find present follower', async () => {

    await this.follower.save();
    const followerPresent = await Follower.isPresent({ instagramId: 'instagramId' });
    expect(followerPresent).to.be.true;

  });

  it('Should not find missing follower', async () => {

    const followerPresent = await Follower.isPresent({ instagramId: 'instagramId' });
    expect(followerPresent).to.be.false;

  });

});