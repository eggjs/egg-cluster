'use strict';

const path = require('path');
const assert = require('assert');
const os = require('os');
const mm = require('egg-mock');
const parseOptions = require('../lib/utils/options');
const utils = require('./utils');

describe('test/options.test.js', () => {
  afterEach(mm.restore);

  it('should return undefined by port as default', () => {
    const options = parseOptions({});
    assert(options.port === undefined);
  });

  it('should start with https and listen 8443', () => {
    const options = parseOptions({
      https: {
        key: utils.getFilepath('server.key'),
        cert: utils.getFilepath('server.cert'),
      },
    });
    assert(options.port === 8443);
    assert(options.https.key);
    assert(options.https.cert);
  });

  it('should start with httpsOptions and listen 8443', () => {
    const options = parseOptions({
      https: {
        passphrase: '123456',
        key: utils.getFilepath('server.key'),
        cert: utils.getFilepath('server.cert'),
        ca: utils.getFilepath('server.ca'),
      },
    });
    assert(options.port === 8443);
    assert(options.https.key);
    assert(options.https.cert);
    assert(options.https.ca);
    assert(options.https.passphrase);
  });

  it('should listen custom port 6001', () => {
    const options = parseOptions({
      port: '6001',
    });
    assert(options.port === 6001);
  });

  it('should set NO_DEPRECATION on production env', () => {
    mm(process.env, 'NODE_ENV', 'production');
    const options = parseOptions({
      workers: 1,
    });
    assert(options.workers === 1);
    assert(process.env.NO_DEPRECATION === '*');
  });

  it('should not extend when port is null/undefined', () => {
    let options = parseOptions({
      port: null,
    });
    assert(options.port === undefined);

    options = parseOptions({
      port: undefined,
    });
    assert(options.port === undefined);
  });

  it('should not call os.cpus when specify workers', () => {
    mm.syncError(os, 'cpus', 'should not call os.cpus');
    const options = parseOptions({
      workers: 1,
    });
    assert(options.workers === 1);
  });

  describe('debug', () => {
    it('empty', () => {
      mm(process, 'execArgv', []);
      const options = parseOptions({});
      assert(options.isDebug === undefined);
    });
    it('--inspect', () => {
      mm(process, 'execArgv', [ '--inspect=9229' ]);
      const options = parseOptions({});
      assert(options.isDebug === true);
    });
    it('--debug', () => {
      mm(process, 'execArgv', [ '--debug=5858' ]);
      const options = parseOptions({});
      assert(options.isDebug === true);
    });
  });

  describe('options', () => {
    let app;
    before(() => {
      app = utils.cluster('apps/options', {
        foo: true,
        framework: path.dirname(require.resolve('egg')),
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
        const frameworkPath = path.join(__dirname, '../node_modules');
        assert(err.message === `noexist is not found in ${frameworkPath}`);
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
        const frameworkPaths = [
          path.join(baseDir, 'node_modules'),
          path.join(process.cwd(), 'node_modules'),
        ].join(',');
        assert(err.message === `noexist is not found in ${frameworkPaths}`);
      }
    });

    it('should get egg by default', () => {
      const baseDir = path.join(__dirname, 'fixtures/apps/framework-egg-default');
      const options = parseOptions({
        baseDir,
      });
      assert(options.framework === path.join(baseDir, 'node_modules/egg'));
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
