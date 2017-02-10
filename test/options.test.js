'use strict';

const path = require('path');
const os = require('os');
const mm = require('egg-mock');
const parseOptions = require('../lib/utils/options');
const utils = require('./utils');


describe('test/options.test.js', function() {

  afterEach(mm.restore);

  it('should start with http and listen 7001', function() {
    parseOptions({
      customEgg: path.dirname(require.resolve('egg')),
    }).port.should.equal(7001);
  });

  it('should start with https and listen 8443', function() {
    parseOptions({
      https: true,
      customEgg: path.dirname(require.resolve('egg')),
      key: utils.getFilepath('server.key'),
      cert: utils.getFilepath('server.crt'),
    }).port.should.equal(8443);
  });

  it('should listen custom port 6001', function() {
    parseOptions({
      port: '6001',
      customEgg: path.dirname(require.resolve('egg')),
    }).port.should.equal(6001);
  });

  it('should set NO_DEPRECATION on production env', function() {
    mm(process.env, 'NODE_ENV', 'production');
    parseOptions({
      workers: 1,
      customEgg: path.dirname(require.resolve('egg')),
    }).workers.should.equal(1);
    process.env.NO_DEPRECATION.should.equal('*');
    process.env.NO_DEPRECATION = '';
    process.env.NO_DEPRECATION.should.equal('');
  });

  it('should not extend when port is null/undefined', function() {
    parseOptions({
      customEgg: path.dirname(require.resolve('egg')),
      port: null,
    }).port.should.equal(7001);
    parseOptions({
      customEgg: path.dirname(require.resolve('egg')),
      port: undefined,
    }).port.should.equal(7001);
  });

  it('should not call os.cpus when specify workers', function() {
    mm.syncError(os, 'cpus', 'should not call os.cpus');
    parseOptions({
      workers: 1,
      customEgg: path.dirname(require.resolve('egg')),
    }).workers.should.equal(1);
  });

  describe('options', () => {
    let app;
    before(() => {
      app = utils.cluster('apps/options', {
        foo: true,
      });
      return app.ready();
    });
    after(() => app.close());
    it('should be passed through', () => {
      app.expect('stdout', /app options foo: true/);
      app.expect('stdout', /agent options foo: true/);
    });
  });
});
