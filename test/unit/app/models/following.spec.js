const path = require('path');
const moment = require('moment');

const Db = require(path.join(srcDir, '/app/models/db') );
const { wait } = require(path.join(srcDir, '/utils') );
const Following = require(path.join(srcDir, '/app/models/following') );

describe('Following', () => {

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

    this.following = new Following({
      socialId: 'socialId',
      username: 'username'
    });

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should find present Following', async () => {

    await this.following.save();
    const FollowingPresent = await Following.isPresent({ socialId: 'socialId' });
    expect(FollowingPresent).to.be.true;

  });

  it('Should not find missing Following', async () => {

    const FollowingPresent = await Following.isPresent({ socialId: 'socialId' });
    expect(FollowingPresent).to.be.false;

  });

  it('Should get olds', async () => {

    await this.following.save();
    const following1 = new Following({
      socialId: 'socialId1',
      username: 'username1'
    });

    await following1.save();
    const date = moment.utc();

    await wait(1000);
    const following2 = new Following({
      socialId: 'socialId2',
      username: 'username2'
    });

    await following2.save();

    const followingsOlds = await Following.findOlds(date);

    expect(followingsOlds.length).to.be.eq(2);
    expect(followingsOlds[0].username).to.be.eq('username');
    expect(followingsOlds[1].username).to.be.eq('username1');

  });

});
