const path = require('path');

const Interface = require(path.join(srcDir, '/app/socialConnectors/interface') );

describe('SocialConnectors:Interface', () => {

  beforeEach( () => {

    this.sandbox = createSandbox();

  });

  afterEach(() => {

    this.sandbox.restore();

  });

  it('Should throw not implemented method', async () => {

    const interface = new Interface();
    await expect(interface.init() ).to.be.rejectedWith(Error, 'not_implemented');
    await expect(interface.getNewFollowers() ).to.be.rejectedWith(Error, 'not_implemented');
    await expect(interface.publish() ).to.be.rejectedWith(Error, 'not_implemented');

  });

});
