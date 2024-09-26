const path = require('path');
const sinon = require('sinon');

const Config = require(path.join(srcDir, '../config') );
const Logger = require(path.join(srcDir, '/utils/logger') );

describe('Logger', () => {

  beforeEach(async () => {

    this.sandbox = sinon.createSandbox();

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should get Logger', () => {

    const logger = Logger();

    expect(logger).to.exist;

  });

  it('Should get Logger production', () => {

    Config.timber.apiKey = 'apiKey';
    const logger = Logger();

    expect(logger).to.exist;
    Config.timber.apiKey = null;

  });

});
