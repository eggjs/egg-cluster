'use strict';

const mm = require('egg-mock');
const assert = require('assert');
const pedding = require('pedding');
const sleep = require('mz-modules/sleep');
const utils = require('./utils');

describe('test/master.test.js', () => {
  let app;

  afterEach(mm.restore);

  describe('start master', () => {
    afterEach(() => app.close());

    it('start success in local env', done => {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');

      app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .notExpect('stdout', /\[master\] agent_worker#1:\d+ start with clusterPort:\d+/)
      .expect('code', 0)
      .end(done);
    });

    it('start success in prod env', done => {
      mm.env('prod');
      app = utils.cluster('apps/mock-production-app').debug(false);

      app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('code', 0)
      .end(err => {
        assert.ifError(err);
        console.log(app.stdout);
        console.log(app.stderr);
        done();
      });
    });
  });

  describe('close master', () => {
    afterEach(() => app.close());

    it('master will close agent and app worker', function* () {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');
      app.debug();

      yield app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('code', 0)
      .end();

      // 2017-05-27 21:24:38,064 INFO 59065 [master] receive signal SIGTERM, closing
      // 2017-05-27 21:24:38,065 INFO 59065 [master] close done, exiting with code:0
      // 2017-05-27 21:24:38,065 INFO 59065 [master] exit with code:0
      // 2017-05-27 21:24:38,067 INFO 59067 [app_worker] receive signal SIGTERM, exiting with code:0
      // 2017-05-27 21:24:38,068 INFO 59067 [app_worker] exit with code:0
      // 2017-05-27 21:24:38,106 INFO 59066 [agent_worker] receive signal SIGTERM, exiting with code:0
      // 2017-05-27 21:24:38,107 INFO 59066 [agent_worker] exit with code:0
      app.proc.kill();

      yield sleep(1000);
      assert(app.proc.killed === true);
      app.expect('stdout', /\[master\] receive signal SIGTERM, closing/);
      app.notExpect('stdout', /\[master\] close done, exiting with code:0/);
      app.expect('stdout', /\[master\] exit with code:0/);
      app.notExpect('stderr', /\[app_worker\] receive disconnect event /);
      app.notExpect('stderr', /\[agent_worker\] receive disconnect event /);
    });

    it('master kill by SIGKILL and agent, app worker exit too', function* () {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');
      app.debug();

      yield app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('code', 0)
      .end();

      // 2017-05-28 00:08:19,047 INFO 59500 [master] egg started on http://127.0.0.1:17001 (2364ms)
      // 2017-05-28 00:08:19,058 ERROR 59502 [app_worker] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false
      // 2017-05-28 00:08:19,108 ERROR 59501 [agent_worker] receive disconnect event on child_process fork mode, exiting with code:110
      // 2017-05-28 00:08:19,109 ERROR 59501 [agent_worker] exit with code:110
      app.proc.kill('SIGKILL');

      yield sleep(1000);
      assert(app.proc.killed === true);
      app.notExpect('stdout', /\[master\] receive signal SIGTERM, closing/);
      app.notExpect('stdout', /\[master\] close done, exiting with code:0/);
      app.notExpect('stdout', /\[master\] exit with code:0/);
      app.expect('stderr', /\[app_worker\] receive disconnect event /);
      app.expect('stderr', /\[agent_worker\] receive disconnect event /);
      app.expect('stderr', /\[agent_worker\] exit with code:110/);
    });

    it('master kill by SIGKILL and exit multi workers', function* () {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started', { workers: 4 });
      app.debug();

      yield app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('code', 0)
      .end();

      // 2017-05-28 00:08:19,047 INFO 59500 [master] egg started on http://127.0.0.1:17001 (2364ms)
      // 2017-05-28 00:08:19,058 ERROR 59502 [app_worker] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false
      // 2017-05-28 00:08:19,108 ERROR 59501 [agent_worker] receive disconnect event on child_process fork mode, exiting with code:110
      // 2017-05-28 00:08:19,109 ERROR 59501 [agent_worker] exit with code:110
      app.proc.kill('SIGKILL');

      yield sleep(1000);
      assert(app.proc.killed === true);
      app.notExpect('stdout', /\[master\] receive signal SIGTERM, closing/);
      app.notExpect('stdout', /\[master\] close done, exiting with code:0/);
      app.notExpect('stdout', /\[master\] exit with code:0/);
      app.expect('stderr', /\[app_worker\] receive disconnect event /);
      app.expect('stderr', /\[agent_worker\] receive disconnect event /);
      app.expect('stderr', /\[agent_worker\] exit with code:110/);
    });

    it('use SIGTERM close master', function* () {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');
      app.debug();

      yield app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('code', 0)
      .end();

      // 2017-05-28 00:14:32,982 INFO 59714 [master] egg started on http://127.0.0.1:17001 (1606ms)
      // 2017-05-28 00:14:32,987 INFO 59714 [master] receive signal SIGTERM, closing
      // 2017-05-28 00:14:32,988 INFO 59714 [master] close done, exiting with code:0
      // 2017-05-28 00:14:32,988 INFO 59714 [master] exit with code:0
      // 2017-05-28 00:14:32,996 INFO 59716 [app_worker] receive signal SIGTERM, exiting with code:0
      // 2017-05-28 00:14:32,997 INFO 59716 [app_worker] exit with code:0
      // 2017-05-28 00:14:33,047 INFO 59715 [agent_worker] receive signal SIGTERM, exiting with code:0
      // 2017-05-28 00:14:33,048 INFO 59715 [agent_worker] exit with code:0
      app.proc.kill('SIGTERM');
      yield sleep(1000);
      assert(app.proc.killed === true);
      app.expect('stdout', /\[master\] receive signal SIGTERM, closing/);
      app.expect('stdout', /\[master\] exit with code:0/);
    });

    it('use SIGQUIT close master', function* () {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');
      app.debug();

      yield app.expect('stdout', /egg start/)
      .expect('stdout', /egg started/)
      .expect('code', 0)
      .end();

      app.proc.kill('SIGQUIT');
      yield sleep(1000);

      assert(app.proc.killed === true);
      app.expect('stdout', /\[master\] receive signal SIGQUIT, closing/);
      app.expect('stdout', /\[master\] exit with code:0/);
    });

    it('use SIGINT close master', function* () {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');
      app.debug();

      yield app
        .expect('stdout', /egg start/)
        .expect('stdout', /egg started/)
        .expect('code', 0)
        .end();

      app.proc.kill('SIGINT');
      yield sleep(1000);

      assert(app.proc.killed === true);
      app.expect('stdout', /\[master\] receive signal SIGINT, closing/);
      app.expect('stdout', /\[master\] exit with code:0/);
    });
  });

  describe('Messenger', () => {
    afterEach(() => app.close());

    it('parent -> app/agent', function* () {
      app = utils.cluster('apps/messenger');
      app.debug();

      yield app.end();

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

      yield sleep(1000);
      app.expect('stdout', /parent -> agent/);
      app.expect('stdout', /parent -> app/);
    });

    it('app/agent -> parent', done => {
      done = pedding(3, done);
      app = utils.cluster('apps/messenger');
      app.debug();
      app.end(done);

      setTimeout(() => {
        app.proc.on('message', msg => {
          if (msg.action === 'app2parent') done();
          if (msg.action === 'agent2parent') done();
        });
      }, 1);
    });

    it('should app <-> agent', function* () {
      app = utils.cluster('apps/messenger');
      app.debug();
      yield app.end();

      yield sleep(10000);
      app.expect('stdout', /app -> agent/);
      app.expect('stdout', /agent -> app/);
      app.expect('stdout', /agent2appbystring/);
    });

    it('should send multi app worker', function* () {
      app = utils.cluster('apps/send-to-multiapp', { workers: 4 });
      app.debug();
      yield app.end();
      yield sleep(1000);
      app.expect('stdout', /\d+ 'got'/);
    });
  });

  describe('--cluster', () => {
    before(() => {
      app = utils.cluster('apps/cluster_mod_app');
      return app.ready();
    });
    after(() => app.close());

    it('should online cluster mode startup success', () => {
      return app.httpRequest()
        .get('/portal/i.htm')
        .expect('hi cluster')
        .expect(200);
    });
  });

  describe('framework start', () => {
    let app;

    afterEach(() => app.close());

    before(() => {
      app = utils.cluster('apps/frameworkapp', {
        customEgg: utils.getFilepath('apps/frameworkbiz'),
      });
      return app.ready();
    });

    it('should start with prod env', () => {
      return app.httpRequest()
        .get('/')
        .expect({
          frameworkCore: true,
          frameworkPlugin: true,
          frameworkAgent: true,
        })
        .expect(200);
    });
  });

  describe('reload worker', () => {
    let app;

    after(() => app.close());

    before(() => {
      app = utils.cluster('apps/reload-worker', {
        workers: 4,
      });
      app.debug();
      return app.ready();
    });

    it('should restart 4 workers', function* () {
      app.process.send({
        to: 'master',
        action: 'reload-worker',
      });
      yield sleep(20000);
      app.expect('stdout', /app_worker#4:\d+ disconnect/);
      app.expect('stdout', /app_worker#8:\d+ started/);
    });
  });

  describe('after started', () => {
    let app;

    after(() => app.close());

    before(() => {
      app = utils.cluster('apps/egg-ready');
      app.debug();
      return app.ready();
    });

    it('app/agent should recieve egg-ready', function* () {
      // work for message sent
      yield sleep(5000);
      app.expect('stdout', /agent receive egg-ready, with 1 workers/);
      app.expect('stdout', /app receive egg-ready/);
    });
  });

  describe('agent should recieve app worker nums', () => {
    let app;
    before(() => {
      mm.env('default');
      app = utils.cluster('apps/pid', { workers: 2 });
      app.coverage(false);
      app.debug();
      return app.ready();
    });
    after(() => app.close());

    it('should every app worker will get message', function* () {
      yield sleep(1000);
      // start two workers
      app.expect('stdout', /#1 agent get 1 workers \[ \d+ \]/);
      app.expect('stdout', /#2 agent get 2 workers \[ \d+, \d+ \]/);
    });

    it('agent should get update message after app died', function* () {
      try {
        yield app.httpRequest()
          .get('/exit')
          .end();
      } catch (_) {
        // ignore
      }

      yield sleep(9000);
      // 一个 worker 挂了
      app.expect('stdout', /#3 agent get 1 workers \[ \d+ \]/);
      // 又启动了一个 worker
      app.expect('stdout', /#4 agent get 2 workers \[ \d+, \d+ \]/);
    });
  });

  describe('app should recieve agent worker nums', () => {
    let app;
    before(() => {
      mm.env('default');
      app = utils.cluster('apps/pid');
      app.coverage(false);
      app.debug();
      return app.ready();
    });
    after(() => app.close());

    it('agent start should get message', function* () {
      app.process.send({
        to: 'agent',
        action: 'kill-agent',
      });

      yield sleep(9000);
      app.expect('stdout', /#1 app get 0 workers \[\]/);
      app.expect('stdout', /#2 app get 1 workers \[ \d+ \]/);
    });
  });

  describe('debug port', () => {
    let app;
    afterEach(() => app.close());

    it('should set agent\'s debugPort', done => {
      app = utils.cluster('apps/agent-debug-port');

      app.debug()
        .coverage(false)
        .expect('stdout', /debug port of agent is 5856/)
        .end(done);
    });
  });

  describe('--sticky', () => {
    before(() => {
      app = utils.cluster('apps/cluster_mod_sticky', { sticky: true });
      app.debug();
      return app.ready();
    });
    after(() => app.close());

    it('should online sticky cluster mode startup success', () => {
      return app.httpRequest()
        .get('/portal/i.htm')
        .expect('hi cluster')
        .expect(200);
    });
  });
});
