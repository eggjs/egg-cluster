
'use strict';

const assert = require('assert');
const path = require('path');
const coffee = require('coffee');
const fs = require('mz/fs');
const sleep = require('mz-modules/sleep');
const fixtures = path.join(__dirname, './fixtures');
const utils = require('./utils');

describe('test/lib/cluster/agent_worker.test.js', () => {
  let app;

  describe('Fork Agent', () => {
    afterEach(() => app.close());

    it('should exist when error happened during boot', done => {
      app = utils.cluster('apps/agent-die-onboot');
      app.debug(false)
      .expect('code', 1)
      .expect('stderr', /\[master\] agent start fail, exit now/)
      .expect('stderr', /error: app worker throw/)
      .end(done);
    });

    it('should refork after app start', function* () {
      app = utils.cluster('apps/agent-die');
      yield app
        .debug(false)
        .end();

      app.process.send({
        to: 'agent',
        action: 'kill-agent',
      });

      yield sleep(8000);

      app.expect('stdout', /Agent Worker restarting/);
      app.expect('stdout', /app get agent-start/);
      app.notExpect('stdout', /App Worker#2/);
    });

    it('should exit during app worker boot', done => {
      app = utils.cluster('apps/agent-die-on-forkapp');
      app.debug(false)
      .expect('code', 1)
      .expect('stderr', /agent start fail/)
      .notExpect('stdout', /App Worker#2/)
      .end(done);
    });

    it('should exit when emit error during agent worker boot', done => {
      app = utils.cluster('apps/agent-start-error');
      app.debug(false)
      .expect('code', 1)
      .end(done);
    });

    // process.send is not exist if started by spawn
    it('master should not die if spawn error', function* () {
      app = coffee.spawn('node', [ utils.getFilepath('apps/agent-die/start.js') ]);
      app.close = () => app.proc.kill();

      yield sleep(10000);
      app.emit('close', 0);
      app.notExpect('stderr', /TypeError: process.send is not a function/);
    });
  });

  describe('agent custom loggers', () => {
    before(() => {
      app = utils.cluster('apps/custom-logger');
      return app.ready();
    });

    after(() => app.close());

    it('should support custom logger in agent', function* () {
      yield sleep(1500);
      const content = yield fs.readFile(path.join(fixtures, 'apps/custom-logger/logs/monitor.log'), 'utf8');
      assert(content === 'hello monitor!\n');
    });
  });
});
