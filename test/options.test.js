'use strict';

const path = require('path');
const assert = require('assert');
const os = require('os');
const mm = require('egg-mock');
const parseOptions = require('../lib/utils/options');
const utils = require('./utils');


describe('test/options.test.js', function() {

  afterEach(mm.restore);

  it('should start with http and listen 7001', function() {
    const options = parseOptions({
      customEgg: path.dirname(require.resolve('egg')),
    });
    assert(options.port === 7001);
  });

  it('should start with https and listen 8443', function() {
    const options = parseOptions({
      https: true,
      customEgg: path.dirname(require.resolve('egg')),
      key: utils.getFilepath('server.key'),
      cert: utils.getFilepath('server.crt'),
    });
    assert(options.port === 8443);
  });

  it('should listen custom port 6001', function() {
    const options = parseOptions({
      port: '6001',
      customEgg: path.dirname(require.resolve('egg')),
    });
    assert(options.port === 6001);
  });

  it('should set NO_DEPRECATION on production env', function() {
    mm(process.env, 'NODE_ENV', 'production');
    const options = parseOptions({
      workers: 1,
      customEgg: path.dirname(require.resolve('egg')),
    });
    assert(options.workers === 1);
    assert(process.env.NO_DEPRECATION === '*');
  });

  it('should not extend when port is null/undefined', function() {
    let options = parseOptions({
      customEgg: path.dirname(require.resolve('egg')),
      port: null,
    });
    assert(options.port === 7001);

    options = parseOptions({
      customEgg: path.dirname(require.resolve('egg')),
      port: undefined,
    });
    assert(options.port === 7001);
  });

  it('should not call os.cpus when specify workers', function() {
    mm.syncError(os, 'cpus', 'should not call os.cpus');
    const options = parseOptions({
      workers: 1,
      customEgg: path.dirname(require.resolve('egg')),
    });
    assert(options.workers === 1);
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

  describe('framework', () => {

    it('should get from absolite path', () => {
      const frameworkPath = path.dirname(require.resolve('egg'));
      const options = parseOptions({
        framework: frameworkPath,
      });
      assert(options.framework === frameworkPath);
    });

    it('should get from absolite path but not exist', () => {
      const frameworkPath = path.join(__dirname, 'noexist');
      try {
        parseOptions({
          framework: frameworkPath,
        });
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === `${frameworkPath} should exist`);
      }
    });

    it('should get from npm package', () => {
      const frameworkPath = path.join(__dirname, '../node_modules/egg');
      const options = parseOptions({
        framework: 'egg',
      });
      assert(options.framework === frameworkPath);
    });

    it('should get from npm package but not exist', () => {
      try {
        parseOptions({
          framework: 'noexist',
        });
        throw new Error('should not run');
      } catch (err) {
        const frameworkPath = path.join(__dirname, '../node_modules/noexist');
        assert(err.message === `${frameworkPath} should exist`);
      }
    });

    it('should get from pkg.egg.framework', () => {
      const baseDir = path.join(__dirname, 'fixtures/apps/framework-pkg-egg');
      const options = parseOptions({
        baseDir,
      });
      assert(options.framework === path.join(baseDir, 'node_modules/yadan'));
    });

    it('should get from pkg.egg.framework but not exist', () => {
      const baseDir = path.join(__dirname, 'fixtures/apps/framework-pkg-egg-noexist');
      try {
        parseOptions({
          baseDir,
        });
        throw new Error('should not run');
      } catch (err) {
        const frameworkPath = path.join(baseDir, 'node_modules/noexist');
        assert(err.message === `${frameworkPath} should exist`);
      }
    });

    it('should get egg by default', () => {
      const baseDir = path.join(__dirname, 'fixtures/apps/framework-egg-default');
      const options = parseOptions({
        baseDir,
      });
      assert(options.framework === path.join(baseDir, 'node_modules/egg'));
    });

    it('should get egg by default but not exist', () => {
      const baseDir = path.join(__dirname, 'fixtures/apps/framework-egg-default-noexist');
      try {
        parseOptions({
          baseDir,
        });
        throw new Error('should not run');
      } catch (err) {
        const frameworkPath = path.join(baseDir, 'node_modules/egg');
        assert(err.message === `${frameworkPath} should exist`);
      }
    });
  });

  it('should exist when specify baseDir', () => {
    it('should get egg by default but not exist', () => {
      const baseDir = path.join(__dirname, 'noexist');
      try {
        parseOptions({
          baseDir,
        });
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === `${path.join(baseDir, 'package.json')} should exist`);
      }
    });
  });
});
