const path = require('path');
const {
  database,
  up,
  down,
} = require('migrate-mongo');

const Db = require(path.join(srcDir, '/app/models/db') );

describe('Migration', () => {

  before(async () => {
    await MockDb.start();
    await Db.connect();
    global.options = {};
    global.options.file = './config/migrateMongoConfig.js';
    this.db = await database.connect();

  });

  after(async () => {

    await Db.disconnect();
    await this.db.close();
    await MockDb.stop();

  });

  beforeEach(async () => {

    this.sandbox = createSandbox();
    await MockDb.reset();

  });

  afterEach( async () => {

    await MockDb.reset();
    this.sandbox.restore();

  });

  describe('active following', () => {

    beforeEach(async () => {

      const res = await this.db.collection('followings').save({
        socialId: 'socialId',
        username: 'username',
        fromTag: 'tag1'
      });

      this.id = res.ops[0]._id;

    });

    it('Should migrate active following', async () => {

      const following = await this.db.collection('followings').findOne({ _id: this.id });
      expect(following.active).to.be.undefined;

      await up(this.db);
      const following1 = await this.db.collection('followings').findOne({ _id: this.id });
      expect(following1.active).to.be.true;

      await down(this.db);
      const following2 = await this.db.collection('followings').findOne({ _id: this.id });
      expect(following2.active).to.be.undefined;

    });

  });

});
