'use strict';

const mm = require('egg-mock');
const should = require('should');
const request = require('supertest');
const pedding = require('pedding');
const utils = require('./utils');

describe('test/lib/cluster/master.test.js', () => {
  let app;

  afterEach(mm.restore);

  describe('start master', () => {
    afterEach(() => {
      app.close();
    });

    it('start success in local env', done => {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');

      app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('stdout', /\\"clusterPort\\":\d+/)
      .expect('code', 0)
      .end(done);
    });

    it('start success in prod env', done => {
      mm.env('prod');
      app = utils.cluster('apps/mock-production-app');

      app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('code', 0)
      .end(() => {
        console.log(app.stdout);
        console.log(app.stderr);
        done();
      });
    });
  });

  describe('close master', () => {
    it('master will close agent', done => {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');

      app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('code', 0)
      .end(function(err) {
        should.not.exists(err);
        this.proc.kill();
        setTimeout(() => {
          this.proc.killed.should.be.true();
          this.expect('stdout', /\[master\] exit with code: 0/);
          this.expect('stdout', /Agent Worker exit with signal SIGTERM/);
          done();
        }, 1000);
      });
    });

    it('use SIGTERM close master', done => {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');

      app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('code', 0)
      .end(function(err) {
        should.not.exists(err);
        this.proc.kill('SIGTERM');
        setTimeout(() => {
          this.proc.killed.should.be.true();
          this.expect('stdout', /\[master\] exit with code: 0/);
          this.expect('stdout', /Agent Worker exit with signal SIGTERM/);
          done();
        }, 1000);
      });
    });

    it('use SIGQUIT close master', done => {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');

      app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('code', 0)
      .end(function(err) {
        should.not.exists(err);
        this.proc.kill('SIGQUIT');
        setTimeout(() => {
          this.proc.killed.should.be.true();
          this.expect('stdout', /\[master\] exit with code: 0/);
          this.expect('stdout', /Agent Worker exit with signal SIGTERM/);
          done();
        }, 1000);
      });
    });

    it('use SIGINT close master', done => {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');

      app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('code', 0)
      .end(function(err) {
        should.not.exists(err);
        this.proc.kill('SIGINT');
        setTimeout(() => {
          this.proc.killed.should.be.true();
          this.expect('stdout', /\[master\] exit with code: 0/);
          this.expect('stdout', /Agent Worker exit with signal SIGTERM/);
          done();
        }, 1000);
      });
    });
  });

  describe('Messenger', () => {
    afterEach(() => {
      app.close();
    });
    it('parent -> app/agent', done => {
      app = utils.cluster('apps/messenger');

      app.end(() => {
        app.proc.send({
          action: 'parent2app',
          data: 'parent -> app',
          to: 'app',
        });
        app.proc.send({
          action: 'parent2agent',
          data: 'parent -> agent',
          to: 'agent',
        });
        setTimeout(() => {
          app.expect('stdout', /parent -> agent/);
          app.expect('stdout', /parent -> app/);
          done();
        }, 1000);
      });
    });

    it('app/agent -> parent', done => {
      done = pedding(3, done);
      app = utils.cluster('apps/messenger');
      app.end(done);

      setTimeout(() => {
        app.proc.on('message', msg => {
          if (msg.action === 'app2parent') done();
          if (msg.action === 'agent2parent') done();
        });
      }, 1);
    });

    it('should app <-> agent', done => {
      app = utils.cluster('apps/messenger');

      app.expect('stdout', /app -> agent/)
      .expect('stdout', /agent -> app/)
      .expect('stdout', /agent2appbystring/)
      .end(() => setTimeout(done, 1000));
    });

    it('should send multi app worker', done => {
      app = utils.cluster('apps/send-to-multiapp', { workers: 4 });
      app.ready(() => {
        setTimeout(() => {
          app.expect('stdout', /\d+ 'got'/);
          done();
        }, 1000);
      });
    });

  });

  describe('--cluster', () => {

    before(done => {
      app = utils.cluster('apps/cluster_mod_app');
      app.ready(done);
    });

    after(() => {
      app.close();
    });

    it('should online cluster mode startup success', done => {
      request(app.callback())
      .get('/portal/i.htm')
      .expect('hi cluster')
      .expect(200, done);
    });
  });

  describe('framework start', () => {
    let app;

    afterEach(() => {
      app.close();
    });

    before(done => {
      app = utils.cluster('apps/frameworkapp', {
        customEgg: utils.getFilepath('apps/frameworkbiz'),
      });
      app.ready(done);
    });

    it('should start with prod env', done => {
      request(app.callback())
      .get('/')
      .expect({
        frameworkCore: true,
        frameworkPlugin: true,
        frameworkAgent: true,
      })
      .expect(200, done);
    });
  });

  describe('reload worker', () => {
    let app;

    after(() => {
      app.close();
    });

    before(done => {
      app = utils.cluster('apps/reload-worker', {
        workers: 4,
      });
      app.debug(false);
      app.ready(done);
    });

    it('should restart 4 workers', done => {
      app.process.send({
        to: 'master',
        action: 'reload-worker',
      });
      setTimeout(() => {
        app.expect('stdout', /App Worker#4:\d+ disconnect/);
        app.expect('stdout', /App Worker#8:\d+ started/);
        done();
      }, 20000);
    });
  });

  describe('after started', () => {
    let app;

    after(() => {
      app.close();
    });

    before(done => {
      app = utils.cluster('apps/egg-ready');
      app.debug(false);
      app.ready(done);
    });

    it('app/agent should recieve egg-ready', done => {
      // 等待消息发送
      setTimeout(() => {
        app.expect('stdout', /agent receive egg-ready, with 1 workers/);
        app.expect('stdout', /app receive egg-ready/);
        done();
      }, 5000);
    });
  });

  describe('agent should recieve app worker nums', () => {
    let app;
    before(done => {
      mm.env('default');
      app = utils.cluster('apps/pid', { workers: 2 });
      app.coverage(false);
      app.debug(false);
      app.ready(done);
    });
    after(() => {
      app.close();
    });

    it('should every app worker will get message', done => {
      setTimeout(() => {
        // 启动两个 worker
        app.expect('stdout', /#1 agent get 1 workers \[ \d+ \]/);
        app.expect('stdout', /#2 agent get 2 workers \[ \d+, \d+ \]/);
        done();
      }, 1000);
    });

    it('agent should get update message after app died', done => {
      request(app.callback())
      .get('/exit')
      .end(() => {
        setTimeout(() => {
          // 一个 worker 挂了
          app.expect('stdout', /#3 agent get 1 workers \[ \d+ \]/);
          // 又启动了一个 worker
          app.expect('stdout', /#4 agent get 2 workers \[ \d+, \d+ \]/);
          done();
        }, 9000);
      });
    });
  });

  describe('app should recieve agent worker nums', () => {
    let app;
    before(done => {
      mm.env('default');
      app = utils.cluster('apps/pid');
      app.coverage(false);
      app.debug(false);
      app.ready(done);
    });
    after(() => {
      app.close();
    });

    it('agent start should get message', done => {
      app.process.send({
        to: 'agent',
        action: 'kill-agent',
      });

      setTimeout(() => {
        app.expect('stdout', /#1 app get 0 workers \[\]/);
        app.expect('stdout', /#2 app get 1 workers \[ \d+ \]/);
        done();
      }, 9000);
    });

  });

  describe('debug port', () => {
    let app;
    afterEach(() => {
      app.close();
    });

    it('should set agent\'s debugPort', done => {
      app = utils.cluster('apps/agent-debug-port');

      app
      .coverage(false)
      .expect('stdout', /debug port of agent is 5856/)
      .end(done);
    });
  });
});
