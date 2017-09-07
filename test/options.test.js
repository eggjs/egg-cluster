'use strict';

const path = require('path');
const assert = require('assert');
const os = require('os');
const mm = require('egg-mock');
const parseOptions = require('../lib/utils/options');
const utils = require('./utils');

describe('test/options.test.js', () => {
  afterEach(mm.restore);

  it('should start with http and listen 7001', () => {
    const options = parseOptions({});
    assert(options.port === 7001);
  });

  it('should start with https and listen 8443', () => {
    const options = parseOptions({
      https: true,
      key: utils.getFilepath('server.key'),
      cert: utils.getFilepath('server.crt'),
    });
    assert(options.port === 8443);
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
    assert(options.port === 7001);

    options = parseOptions({
      port: undefined,
    });
    assert(options.port === 7001);
  });

  it('should not call os.cpus when specify workers', () => {
    mm.syncError(os, 'cpus', 'should not call os.cpus');
    const options = parseOptions({
      workers: 1,
    });
    assert(options.workers === 1);
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

  describe('debug', () => {
    it('debug = true', () => {
      const options = parseOptions({
        debug: true,
      });
      assert(options.debug === 9229 || options.debug === 5858);
      assert(options.debugProtocol !== undefined);
    });

    it('debug = 9999', () => {
      const options = parseOptions({
        debug: 9999,
      });
      assert(options.debug === 9999);
      assert(options.debugProtocol !== undefined);
      assert(options.appExecArgv[0] === `--${options.debugProtocol}=9999`);
    });

    it('debugBrk = true', () => {
      const options = parseOptions({
        debugBrk: true,
      });
      assert(options.debugBrk === true);
      assert(options.debug === 9229 || options.debug === 5858);
      assert(options.debugProtocol !== undefined);
    });

    it('debugBrk = 9999', () => {
      const options = parseOptions({
        debugBrk: 9999,
      });
      assert(options.debugBrk === true);
      assert(options.debug === 9999);
      assert(options.debugProtocol !== undefined);
      assert(options.appExecArgv[0] === `--${options.debugProtocol}=9999`);
      assert(options.appExecArgv[1] === `--${options.debugProtocol}-brk`);
    });

    it('debug = 9999, debugBrk = 1234', () => {
      // only use debug's port
      const options = parseOptions({
        debug: 9999,
        debugBrk: 1234,
      });
      assert(options.debugBrk === true);
      assert(options.debug === 9999);
      assert(options.debugProtocol !== undefined);
      assert(options.appExecArgv[0] === `--${options.debugProtocol}=9999`);
      assert(options.appExecArgv[1] === `--${options.debugProtocol}-brk`);
    });

    it('debug = 9999, debugBrk = true', () => {
      // only use debug's port
      const options = parseOptions({
        debug: 9999,
        debugBrk: true,
      });
      assert(options.debugBrk === true);
      assert(options.debug === 9999);
      assert(options.debugProtocol !== undefined);
      assert(options.appExecArgv[0] === `--${options.debugProtocol}=9999`);
      assert(options.appExecArgv[1] === `--${options.debugProtocol}-brk`);
    });

    // ==== agent ====

    it('debugAgent = true', () => {
      const options = parseOptions({
        debugAgent: true,
      });
      assert(options.debugAgent === 9227 || options.debugAgent === 5856);
      assert(options.debugProtocol !== undefined);
    });

    it('debugAgent = 9999', () => {
      const options = parseOptions({
        debugAgent: 9999,
      });
      assert(options.debugAgent === 9999);
      assert(options.debugProtocol !== undefined);
      assert(options.agentExecArgv[0] === `--${options.debugProtocol}=9999`);
    });

    it('debugAgentBrk = true', () => {
      const options = parseOptions({
        debugAgentBrk: true,
      });
      assert(options.debugAgentBrk === true);
      assert(options.debugAgent === 9227 || options.debugAgent === 5856);
      assert(options.debugProtocol !== undefined);
    });

    it('debugAgentBrk = 9999', () => {
      const options = parseOptions({
        debugAgentBrk: 9999,
      });
      assert(options.debugAgentBrk === true);
      assert(options.debugAgent === 9999);
      assert(options.debugProtocol !== undefined);
      assert(options.agentExecArgv[0] === `--${options.debugProtocol}=9999`);
      assert(options.agentExecArgv[1] === `--${options.debugProtocol}-brk`);
    });

    it('debugAgent = 9999, debugAgentBrk = 1234', () => {
      // only use debugAgent's port
      const options = parseOptions({
        debugAgent: 9999,
        debugAgentBrk: 1234,
      });
      assert(options.debugAgentBrk === true);
      assert(options.debugAgent === 9999);
      assert(options.debugProtocol !== undefined);
      assert(options.agentExecArgv[0] === `--${options.debugProtocol}=9999`);
      assert(options.agentExecArgv[1] === `--${options.debugProtocol}-brk`);
    });

    it('debugAgent = 9999, debugAgentBrk = true', () => {
      // only use debug's port
      const options = parseOptions({
        debugAgent: 9999,
        debugAgentBrk: true,
      });
      assert(options.debugAgentBrk === true);
      assert(options.debugAgent === 9999);
      assert(options.debugProtocol !== undefined);
      assert(options.agentExecArgv[0] === `--${options.debugProtocol}=9999`);
      assert(options.agentExecArgv[1] === `--${options.debugProtocol}-brk`);
    });

    // ==== both ====

    it('debug = 5000, debugAgent = true', () => {
      const options = parseOptions({
        debug: 5002,
        debugAgent: true,
      });
      assert(options.debug === 5002);
      assert(options.debugAgent === 5000);
      assert(options.debugProtocol !== undefined);
    });

    it('debug = 5000, debugAgent = 9999', () => {
      const options = parseOptions({
        debug: 5002,
        debugAgent: 9999,
      });
      assert(options.debug === 5002);
      assert(options.debugAgent === 9999);
      assert(options.debugProtocol !== undefined);
    });
  });
});
