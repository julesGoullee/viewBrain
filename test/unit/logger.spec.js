const path = require('path');
const Winston = require('winston');
const timber = require('timber');

const Config = require(path.join(srcDir, '../config') );
const Logger = require(path.join(srcDir, '/logger') );

describe('Logger', () => {

  beforeEach(async () => {

    this.sandbox = createSandbox();

  });

  afterEach( () => {

    this.sandbox.restore();

  });

  it('Should get Logger', () => {

    const logger = Logger();

    expect(logger).to.be.an.instanceof(Winston.Logger);
    expect(logger.transports.console.formatter).to.be.null;

  });

  it('Should get Logger production', () => {

    Config.env = 'production';

    const logger = Logger();

    expect(logger.transports.console.formatter).to.be.eq(timber.formatters.Winston);

    Config.env = 'development';

  });

});
