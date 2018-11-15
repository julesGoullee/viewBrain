const path = require('path');
const Insta = require('instagram-web-api');

const Config = require(path.join(srcDir, '../config') );
const { logger } = require(path.join(srcDir, 'utils') );

const Db = require(path.join(srcDir, 'app/db') );
const User = require(path.join(srcDir, 'app/user') );
const Instagram = require(path.join(srcDir, 'app/instagram') );

describe('Instagram', () => {

  before( async () => {

    await MockDb.start();

    await Db.connect();

  });

  after(async () => {

    await Db.disconnect();
    await MockDb.stop();

  });

  beforeEach( async () => {

    this.sandbox = createSandbox();
    await MockDb.reset();
    this.instagram = new Instagram({
      username: 'instagram_username',
      password: 'instagram_password'
    });

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should create instance', () => {

    const instagram = new Instagram({
      username: 'instagram_username',
      password: 'instagram_password'
    });

    expect(instagram.username).to.be.eq('instagram_username');
    expect(instagram.instagramId).to.be.null;
    expect(instagram.client).to.be.an.instanceof(Insta);
    expect(instagram.limitedGetFollowers).to.exist;
    expect(instagram.initilized).to.be.false;

  });

  it('Cannot create instance without username or password', () => {

    expect(() => new Instagram() ).to.throw('invalid_username_or_password');
    expect(() => new Instagram({}) ).to.throw('invalid_username_or_password');
    expect(() => new Instagram({ username: 'username'}) ).to.throw('invalid_username_or_password');
    expect(() => new Instagram({ password: 'password'}) ).to.throw('invalid_username_or_password');

  });

  it('Cannot call methods without initialize', async () => {

    const asyncMethods = [
      'getNewFollowers',
      'publish'
    ];

    await Promise.all(asyncMethods.map(method =>
      expect(this.instagram[method]() ).to.be.rejectedWith(Error, 'uninitialized_account')
    ) );
  });

  describe('Initialize', () => {

    beforeEach( () => {

      this.stubLogin = this.sandbox.stub(this.instagram.client, 'login');
      this.stubGetProfile = this.sandbox.stub(this.instagram.client, 'getProfile');
      this.stubGetUserByUsername = this.sandbox.stub(this.instagram.client, 'getUserByUsername');

    });

    it('Should initialize', async () => {

      this.stubGetProfile.resolves({
        is_email_confirmed: true
      });

      this.stubGetUserByUsername.resolves({
        id: 'instagram_id'
      });

      await this.instagram.init();
      expect(this.stubLogin.calledOnce).to.be.true;
      expect(this.stubGetProfile.calledOnce).to.be.true;
      expect(this.stubGetUserByUsername.calledOnce).to.be.true;
      expect(this.stubGetUserByUsername.calledWith({ username: 'instagram_username' })).to.be.true;
      expect(this.instagram.initilized).to.be.true;
      expect(this.instagram.instagramId).to.be.eq('instagram_id');

    });

    it('Cannot initialize if login failed', async () => {

      this.stubLogin.rejects(new Error('fake-error-login') );

      await expect(this.instagram.init() ).to.be.rejectedWith(Error, 'fake-error-login');

    });

    it('Cannot initialize with invalid profile', async () => {

      this.stubGetProfile.resolves({
        is_email_confirmed: false
      });

      await expect(this.instagram.init() ).to.be.rejectedWith(Error, 'invalid_profile');
      expect(this.stubGetProfile.calledOnce).to.be.true;

    });

    it('Cannot initialize with invalid user', async () => {

      this.stubGetProfile.resolves({
        is_email_confirmed: true
      });

      this.stubGetUserByUsername.resolves({});
      await expect(this.instagram.init() ).to.be.rejectedWith(Error, 'invalid_user');
      expect(this.stubGetUserByUsername.calledOnce).to.be.true;

    });

  });

  describe('With initialized account', () => {

    beforeEach( async () => {

      this.stubLogin = this.sandbox.stub(this.instagram.client, 'login').resolves();
      this.stubGetProfile = this.sandbox.stub(this.instagram.client, 'getProfile').resolves({
        is_email_confirmed: true
      });
      this.stubGetUserByUsername = this.sandbox.stub(this.instagram.client, 'getUserByUsername').resolves({
        id: 'instagram_id'
      });
      this.stubUploadPhoto = this.sandbox.stub(this.instagram.client, 'uploadPhoto');

      await this.instagram.init();

    });

    describe('NewFollowers', () => {

      beforeEach( () => {

        this.stubGetFollowers = this.sandbox.stub(this.instagram, 'limitedGetFollowers')

      });

      it('Should get only new followers with one page', async () => {

        this.stubGetFollowers.resolves({
          data: [
            {
              id: 'id1',
              username: 'username1'
            },
            {
              id: 'id2',
              username: 'username2'
            }
          ],
          page_info: {
            has_next_page: false
          }
        });

        const followers = await this.instagram.getNewFollowers();

        expect(this.stubGetFollowers.calledOnce).to.be.true;
        expect(this.stubGetFollowers.calledWith({
          userId: 'instagram_id',
          first: 50,
          after: null
        }) ).to.be.true;
        expect(followers.length).to.be.eq(2);
        expect(followers[0]).to.be.deep.eq({
          instagramId: 'id1',
          username: 'username1'
        });
        expect(followers[1]).to.be.deep.eq({
          instagramId: 'id2',
          username: 'username2'
        });

      });

      it('Should get new and existing followers with one page', async () => {

        const user = new User({
          instagramId: 'id1',
          username: 'username',
        });

        await user.save();
        this.stubGetFollowers.resolves({
          data: [
            {
              id: user.instagramId,
              username: user.username
            },
            {
              id: 'id2',
              username: 'username2'
            }
          ],
          page_info: {
            has_next_page: false
          }
        });

        const followers = await this.instagram.getNewFollowers();

        expect(this.stubGetFollowers.calledOnce).to.be.true;
        expect(this.stubGetFollowers.calledWith({
          userId: 'instagram_id',
          first: 50,
          after: null
        }) ).to.be.true;
        expect(followers.length).to.eq(1);
        expect(followers[0]).to.be.deep.eq({
          instagramId: 'id2',
          username: 'username2'
        });

      });

      it('Should get existing followers with one page', async () => {

        const user = new User({
          instagramId: 'id1',
          username: 'username',
        });

        const user2 = new User({
          instagramId: 'id2',
          username: 'username2',
        });

        await user.save();
        await user2.save();

        this.stubGetFollowers.resolves({
          data: [
            {
              id: user.instagramId,
              username: user.username
            },
            {
              id: user2.instagramId,
              username: user2.username
            }
          ],
          page_info: {
            has_next_page: false
          }
        });

        const followers = await this.instagram.getNewFollowers();

        expect(this.stubGetFollowers.calledOnce).to.be.true;
        expect(followers.length).to.eq(0);

      });

      it('Should get only new followers with multiple pages and stop at the last page', async () => {

        this.stubGetFollowers.onFirstCall().resolves({
          data: [
            {
              id: 'id1',
              username: 'username',
            },
            {
              id: 'id2',
              username: 'username2',
            }
          ],
          page_info: {
            has_next_page: true,
            end_cursor: 'end_cursor'
          }
        });

        this.stubGetFollowers.onSecondCall().resolves({
          data: [
            {
              id: 'id3',
              username: 'username3',
            },
            {
              id: 'id4',
              username: 'username4',
            }
          ],
          page_info: {
            has_next_page: false
          }
        });

        const followers = await this.instagram.getNewFollowers();

        expect(this.stubGetFollowers.callCount).to.be.eq(2);
        expect(this.stubGetFollowers.args[1][0]).to.be.deep.eq({
          userId: 'instagram_id',
          first: 50,
          after: 'end_cursor'
        });

        expect(followers.length).to.eq(4);
        expect(followers[0]).to.be.deep.eq({
          instagramId: 'id1',
          username: 'username'
        });
        expect(followers[3]).to.be.deep.eq({
          instagramId: 'id4',
          username: 'username4'
        });

      });

      it('Should get new followers and existing at the beginning with multiple pages and stop at the end', async () => {

        const user = new User({
          instagramId: 'id1',
          username: 'username',
        });

        await user.save();

        this.stubGetFollowers.onFirstCall().resolves({
          data: [
            {
              id: user.instagramId,
              username: user.username
            },
            {
              id: 'id2',
              username: 'username2',
            }
          ],
          page_info: {
            has_next_page: true,
            end_cursor: 'end_cursor'
          }
        });

        this.stubGetFollowers.onSecondCall().resolves({
          data: [
            {
              id: 'id3',
              username: 'username3',
            },
            {
              id: 'id4',
              username: 'username4',
            }
          ],
          page_info: {
            has_next_page: false
          }
        });

        const followers = await this.instagram.getNewFollowers();

        expect(this.stubGetFollowers.callCount).to.be.eq(2);
        expect(followers.length).to.eq(3);
        expect(followers[0]).to.be.deep.eq({
          instagramId: 'id2',
          username: 'username2'
        });
        expect(followers[2]).to.be.deep.eq({
          instagramId: 'id4',
          username: 'username4'
        });

      });

      it('Should get new followers and existing at the end with multiple pages and stop at the end', async () => {

        const user = new User({
          instagramId: 'id4',
          username: 'username4',
        });
        const user2 = new User({
          instagramId: 'id3',
          username: 'username3',
        });

        await user.save();
        await user2.save();

        this.stubGetFollowers.onFirstCall().resolves({
          data: [
            {
              id: 'id1',
              username: 'username',
            },
            {
              id: 'id2',
              username: 'username2',
            }
          ],
          page_info: {
            has_next_page: true,
            end_cursor: 'end_cursor'
          }
        });

        this.stubGetFollowers.onSecondCall().resolves({
          data: [
            {
              id: 'id3',
              username: 'username3',
            },
            {
              id: 'id4',
              username: 'username4',
            }
          ],
          page_info: {
            has_next_page: true,
            end_cursor: 'end_cursor1'
          }
        });

        const followers = await this.instagram.getNewFollowers();

        expect(this.stubGetFollowers.callCount).to.be.eq(2);
        expect(followers.length).to.eq(2);
        expect(followers[0]).to.be.deep.eq({
          instagramId: 'id1',
          username: 'username'
        });
        expect(followers[1]).to.be.deep.eq({
          instagramId: 'id2',
          username: 'username2'
        });

      });

      it('Should get new followers and existing with multiple pages and stop with no new in one page', async () => {

        const user = new User({
          instagramId: 'id4',
          username: 'username4',
        });

        await user.save();

        this.stubGetFollowers.onFirstCall().resolves({
          data: [
            {
              id: 'id1',
              username: 'username',
            },
            {
              id: 'id2',
              username: 'username2',
            }
          ],
          page_info: {
            has_next_page: true,
            end_cursor: 'end_cursor'
          }
        });

        this.stubGetFollowers.onSecondCall().resolves({
          data: [
            {
              id: 'id3',
              username: 'username3',
            },
            {
              id: 'id4',
              username: 'username4',
            }
          ],
          page_info: {
            has_next_page: false
          }
        });

        const followers = await this.instagram.getNewFollowers();

        expect(this.stubGetFollowers.callCount).to.be.eq(2);
        expect(followers.length).to.eq(3);
        expect(followers[0]).to.be.deep.eq({
          instagramId: 'id1',
          username: 'username'
        });
        expect(followers[2]).to.be.deep.eq({
          instagramId: 'id3',
          username: 'username3'
        });

      });

    });

    it.skip('Should return followers in deterministic or after unfollow', async () => {

      const instagram = new Instagram({
        username: Config.instagram.username,
        password: Config.instagram.password
      });

      await instagram.init();

      const followers = await instagram.getNewFollowers();
      logger.info(followers);

    });

    it('Should publish', async () => {

      this.stubUploadPhoto.resolves({
        status: 'ok'
      });

      const res = await this.instagram.publish('./outputs/out_id.jpg', 'username');
      expect(res).to.be.true;
      expect(this.stubUploadPhoto.calledOnce).to.be.true;
      expect(this.stubUploadPhoto.calledWith({
        photo: './outputs/out_id.jpg',
        caption: '#ok @username'
      }) ).to.be.true;

    });

    it('Should throw is upload failed', async () => {

      this.stubUploadPhoto.resolves({
        status: 'failed'
      });

      await expect(this.instagram.publish('./outputs/out_id.jpg', 'username') ).to.be.rejectedWith(Error, 'cannot_publish');

    });

  });

});
