'use strict';

const path = require('path');
const mm = require('egg-mock');
const assert = require('assert');
const pedding = require('pedding');
const sleep = require('mz-modules/sleep');
const request = require('supertest');
const semver = require('semver');
const awaitEvent = require('await-event');
const fs = require('mz/fs');
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
      mm(process.env, 'EGG_APP_WORKER_LOGGER_LEVEL', 'INFO');
      mm(process.env, 'EGG_AGENT_WORKER_LOGGER_LEVEL', 'INFO');
      mm(process.env, 'EGG_MASTER_LOGGER_LEVEL', 'DEBUG');
      app = utils.cluster('apps/master-worker-started');
      // app.debug();

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
      app.proc.kill('SIGTERM');
      yield sleep(1000);
      assert(app.proc.killed === true);
      app.expect('stdout', /INFO \d+ \[master\] receive signal SIGTERM, closing/);
      app.expect('stdout', /DEBUG \d+ \[master\] close done, exiting with code:0/);
      app.expect('stdout', /INFO \d+ \[master\] exit with code:0/);
      // app.expect('stdout', /INFO \d+ \[app_worker\] receive signal SIGTERM, exiting with code:0/);
      // app.expect('stdout', /INFO \d+ \[agent_worker\] receive signal SIGTERM, exiting with code:0/);
      // app.notExpect('stderr', /\[app_worker\] receive disconnect event in cluster fork mode/);
      // app.notExpect('stderr', /\[agent_worker\] receive disconnect event /);
      app.expect('stdout', /INFO \d+ \[app_worker\] exit with code:0/);
      app.expect('stdout', /INFO \d+ \[agent_worker\] exit with code:0/);
    });

    it('master kill by SIGKILL and agent, app worker exit too', function* () {
      mm.env('local');
      app = utils.cluster('apps/master-worker-started');
      // app.debug();

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
      // app.debug();

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
      // app.debug();

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
      // app.debug();

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
      // app.debug();

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
      // app.debug();

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
      // app.debug();
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
      // app.debug();
      yield app.end();

      yield sleep(10000);
      app.expect('stdout', /app -> agent/);
      app.expect('stdout', /agent -> app/);
      app.expect('stdout', /app: agent2appbystring/);
      app.expect('stdout', /agent: app2agentbystring/);
    });

    it('should send multi app worker', function* () {
      app = utils.cluster('apps/send-to-multiapp', { workers: 4 });
      // app.debug();
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
      // app.debug();
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
    let readyMsg;

    before(() => {
      mm.env('default');
      app = utils.cluster('apps/egg-ready');
      // app.debug();
      setTimeout(() => {
        app.proc.on('message', msg => {
          if (msg.to === 'parent' && msg.action === 'egg-ready') {
            readyMsg = `parent: port=${msg.data.port}, address=${msg.data.address}`;
          }
        });
      }, 1);
      return app.ready();
    });
    after(() => app.close());

    it('app/agent should recieve egg-ready', function* () {
      // work for message sent
      yield sleep(5000);
      assert(readyMsg.match(/parent: port=\d+, address=http:\/\/127.0.0.1:\d+/));
      app.expect('stdout', /agent receive egg-ready, with 1 workers/);
      app.expect('stdout', /app receive egg-ready, worker 1/);
    });

    it('should recieve egg-ready when app restart', function* () {
      yield request(app.callback())
        .get('/exception-app')
        .expect(200);

      yield sleep(5000);

      app.expect('stdout', /app receive egg-ready, worker 2/);
    });

    it('should recieve egg-ready when agent restart', function* () {
      yield request(app.callback())
        .get('/exception-agent')
        .expect(200);

      yield sleep(5000);

      const matched = app.stdout.match(/agent receive egg-ready/g);
      assert(matched.length === 2);
    });
  });

  describe('agent should recieve app worker nums', () => {
    let app;
    before(() => {
      mm.env('default');
      app = utils.cluster('apps/pid', { workers: 2 });
      // app.debug();
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
      // oh, one worker dead
      app.expect('stdout', /#3 agent get 1 workers \[ \d+ \]/);
      // never mind, fork new worker
      app.expect('stdout', /#4 agent get 2 workers \[ \d+, \d+ \]/);
    });

    it('agent should get message when agent restart', function* () {
      app.process.send({
        to: 'agent',
        action: 'kill-agent',
      });

      yield sleep(5000);
      app.expect('stdout', /#1 agent get 2 workers \[ \d+, \d+ \]/);
    });
  });

  describe('app should recieve agent worker nums', () => {
    let app;
    before(() => {
      mm.env('default');
      app = utils.cluster('apps/pid');
      app.coverage(false);
      // app.debug();
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

  describe('debug', () => {
    let app;
    afterEach(() => app.close());

    // 6.x: Debugger listening on [::]:5858
    // 8.x: Debugger listening on ws://127.0.0.1:9229/221caad4-e2d0-4630-b0bb-f7fb27b81ff6
    const debugProtocol = semver.gte(process.version, '8.0.0') ? 'inspect' : 'debug';

    it('should debug', () => {
      app = utils.cluster('apps/debug-port', { workers: 2, opt: { execArgv: [ `--${debugProtocol}` ] } });

      return app
        // .debug()
        .coverage(false)
        // master
        .expect('stderr', /Debugger listening on .*:(5858|9229)/)
        // agent
        .expect('stderr', /Debugger listening on .*:5800/)
        .expect('stdout', /debug port of agent is 5800/)
        // worker#1
        .expect('stderr', /Debugger listening on .*:(5859|9230)/)
        .expect('stdout', /debug port of app is (5859|9230)/)
        // worker#2
        .expect('stderr', /Debugger listening on .*:(5860|9231)/)
        .expect('stdout', /debug port of app is (5860|9231)/)
        .end();
    });

    it('should debug with port', () => {
      app = utils.cluster('apps/debug-port', { workers: 2, opt: { execArgv: [ `--${debugProtocol}=9000` ] } });

      return app
        // .debug()
        .coverage(false)
        // master
        .expect('stderr', /Debugger listening on .*:9000/)
        // agent
        .expect('stderr', /Debugger listening on .*:5800/)
        .expect('stdout', /debug port of agent is 5800/)
        // worker#1
        .expect('stderr', /Debugger listening on .*:9001/)
        .expect('stdout', /debug port of app is 9001/)
        // worker#2
        .expect('stderr', /Debugger listening on .*:9002/)
        .expect('stdout', /debug port of app is 9002/)
        .end();
    });

    describe('debug message', () => {
      const result = { app: [], agent: {} };

      after(() => app.close());

      before(() => {
        app = utils.cluster('apps/egg-ready', { workers: 2, opt: { execArgv: [ `--${debugProtocol}` ] } });
        // app.debug();
        setTimeout(() => {
          app.proc.on('message', msg => {
            if (msg.to === 'parent' && msg.action === 'debug') {
              if (msg.from === 'agent') {
                result.agent = msg.data;
              } else {
                result.app.push(msg.data);
              }
            }
          });
        }, 1);
        return app.ready();
      });

      it('parent should recieve debug', function* () {
        // work for message sent
        yield sleep(5000);
        app.expect('stdout', /agent receive egg-ready, with 2 workers/);
        app.expect('stdout', /app receive egg-ready/);
        assert(result.agent.debugPort === 5800);
        assert(result.app.length === 2);
        assert(result.app[0].pid);
        assert(result.app[0].debugPort === 5859 || result.app[0].debugPort === 9230);
        assert(result.app[1].debugPort === 5860 || result.app[1].debugPort === 9231);
      });
    });

    describe('debug message with port', () => {
      const result = { app: [], agent: {} };

      after(() => app.close());

      before(() => {
        app = utils.cluster('apps/egg-ready', { workers: 2, opt: { execArgv: [ `--${debugProtocol}=9000` ] } });
        // app.debug();
        setTimeout(() => {
          app.proc.on('message', msg => {
            if (msg.to === 'parent' && msg.action === 'debug') {
              if (msg.from === 'agent') {
                result.agent = msg.data;
              } else {
                result.app.push(msg.data);
              }
            }
          });
        }, 1);
        return app.ready();
      });

      it('parent should recieve debug', function* () {
        // work for message sent
        yield sleep(5000);
        app.expect('stdout', /agent receive egg-ready, with 2 workers/);
        app.expect('stdout', /app receive egg-ready/);
        assert(result.agent.debugPort === 5800);
        assert(result.app.length === 2);
        assert(result.app[0].debugPort && result.app[0].pid);
        assert(result.app[0].debugPort === 9001);
        assert(result.app[1].debugPort === 9002);
      });
    });

    describe('should not debug message', () => {
      let result;

      after(() => app.close());

      before(() => {
        app = utils.cluster('apps/egg-ready');
        // app.debug();
        setTimeout(() => {
          app.proc.on('message', msg => {
            if (msg.to === 'parent' && msg.action === 'debug') {
              result = true;
            }
          });
        }, 1);
        return app.ready();
      });

      it('parent should not recieve debug', function* () {
        // work for message sent
        yield sleep(5000);
        app.expect('stdout', /agent receive egg-ready, with 1 workers/);
        app.expect('stdout', /app receive egg-ready/);
        assert(!result);
      });
    });

    describe('kill at debug', () => {
      let workerPid;

      after(() => app.close());

      before(() => {
        app = utils.cluster('apps/egg-ready', { workers: 1, opt: { execArgv: [ `--${debugProtocol}` ] } });
        // app.debug();
        setTimeout(() => {
          app.proc.on('message', msg => {
            if (msg.to === 'parent' && msg.action === 'debug' && msg.from === 'app') {
              workerPid = msg.data.pid;
            }
            if (msg.action === 'egg-ready') {
              process.kill(workerPid, 'SIGKILL');
            }
          });
        }, 1);
        return app.ready();
      });

      it('should not log err', function* () {
        // work for message sent
        yield sleep(5000);
        app.expect('stderr', /\[master] app_worker#.*signal: SIGKILL/);
        app.expect('stderr', /\[master] worker kill by debugger, exiting/);
        app.expect('stdout', /\[master] exit with code:0/);
        app.notExpect('stderr', /AppWorkerDiedError/);
      });
    });
  });

  describe('--sticky', () => {
    before(() => {
      app = utils.cluster('apps/cluster_mod_sticky', { sticky: true });
      // app.debug();
      return app.ready();
    });
    after(() => app.close());

    it('should online sticky cluster mode startup success', () => {
      app.expect('stdout', /egg started on http:\/\/127.0.0.1:17010/);
      return request('http://127.0.0.1:17010')
        .get('/portal/i.htm')
        .expect('hi cluster')
        .expect(200);
    });
  });

  describe('agent and worker exception', () => {
    it('should exit when no agent after check 3 times', function* () {
      // app worker won't be reforked in local
      mm.env('local');
      app = utils.cluster('apps/check-status');
      // app.debug();
      yield app.ready();
      yield fs.writeFile(path.join(app.baseDir, 'logs/started'), '');

      // kill agent worker and will exit when start
      app.process.send({ to: 'agent', action: 'kill' });

      yield awaitEvent(app.proc, 'exit');

      assert(app.stderr.includes('nodejs.ClusterWorkerExceptionError: [master] 0 agent and 1 worker(s) alive, exit to avoid unknown state'));
      assert(app.stderr.includes('[master] exit with code:1'));
    });

    it('should exit when no app after check 3 times', function* () {
      // app worker won't be reforked in local
      mm.env('local');
      app = utils.cluster('apps/check-status');
      yield app.ready();

      // kill app worker and wait checking
      app.process.send({ to: 'app', action: 'kill' });

      yield awaitEvent(app.proc, 'exit');

      assert(app.stderr.includes('nodejs.ClusterWorkerExceptionError: [master] 1 agent and 0 worker(s) alive, exit to avoid unknown state'));
      assert(app.stderr.includes('[master] exit with code:1'));
    });
  });
});
