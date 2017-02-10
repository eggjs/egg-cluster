
'use strict';

const fs = require('fs');
const path = require('path');
const coffee = require('coffee');
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

    it('should refork after app start', done => {
      app = utils.cluster('apps/agent-die');
      app.debug(false)
      .end(function() {
        app.process.send({
          to: 'agent',
          action: 'kill-agent',
        });
        setTimeout(() => {
          this.expect('stdout', /Agent Worker restarting/);
          this.expect('stdout', /app get agent-start/);
          this.notExpect('stdout', /App Worker#2/);
          done();
        }, 8000);
      });
    });

    it('should exit during app worker boot', done => {
      app = utils.cluster('apps/agent-die-on-forkapp');
      app.debug(false)
      .expect('code', 1)
      .expect('stderr', /agent start fail/)
      .notExpect('stdout', /App Worker#2/)
      .end(done);
    });

    // process.send is not exist if started by spawn
    it('master should not die if spawn error', done => {
      app = coffee.spawn('node', [ utils.getFilepath('apps/agent-die/start.js') ]);
      app.close = () => app.proc.kill();

      setTimeout(() => {
        app.emit('close', 0);
        app.notExpect('stderr', /TypeError: process.send is not a function/);
        done();
      }, 10000);
    });
  });

  describe('agent custom loggers', () => {
    before(() => {
      app = utils.cluster('apps/custom-logger');
      return app.ready();
    });

    after(() => app.close());

    it('should support custom logger in agent', done => {
      setTimeout(() => {
        fs.readFileSync(path.join(fixtures, 'apps/custom-logger/logs/monitor.log'), 'utf8').should.equal('hello monitor!\n');
        done();
      }, 1500);
    });
  });
});
