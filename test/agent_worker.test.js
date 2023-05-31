const assert = require('assert');
const path = require('path');
const coffee = require('coffee');
const mm = require('egg-mock');
const { readFile } = require('fs/promises');
const { sleep } = require('../lib/utils/timer');
const utils = require('./utils');

describe('test/agent_worker.test.js', () => {
  let app;

  describe('Fork Agent', () => {
    afterEach(() => app && app.close());

    it('support config agent debug port', () => {
      mm(process.env, 'EGG_AGENT_DEBUG_PORT', '15800');
      app = utils.cluster('apps/agent-debug-port', { isDebug: true });
      return app
        .expect('stdout', /15800/)
        .end();
    });

    it('agent debug port default 5800', () => {
      app = utils.cluster('apps/agent-debug-port', { isDebug: true });
      return app
        .expect('stdout', /5800/)
        .end();
    });

    it('should exist when error happened during boot', () => {
      app = utils.cluster('apps/agent-die-onboot');
      return app
        // .debug()
        .expect('code', 1)
        .expect('stderr', /\[master\] agent_worker#1:\d+ start fail, exiting with code:1/)
        .expect('stderr', /error: app worker throw/)
        .end();
    });

    it('should not start app when error happened during agent starting', () => {
      app = utils.cluster('apps/agent-die-onboot');
      return app
        .expect('code', 1)
        .expect('stderr', /\[master\] agent_worker#1:\d+ start fail, exiting with code:1/)
        .expect('stderr', /error: app worker throw/)
        .notExpect('stdout', /agent\-error\-but\-app\-start/)
        .end();
    });

    it('should refork new agent_worker after app started', async () => {
      app = utils.cluster('apps/agent-die');
      await app
        // .debug()
        .expect('stdout', /\[master\] egg started on http:\/\/127.0.0.1:\d+/)
        .end();

      app.process.send({
        to: 'agent',
        action: 'kill-agent',
      });

      await sleep(20000);

      app.expect('stderr', /\[master\] agent_worker#1:\d+ died/);
      app.expect('stdout', /\[master\] try to start a new agent_worker after 1s .../);
      app.expect('stdout', /\[master\] agent_worker#2:\d+ started/);
      app.notExpect('stdout', /app_worker#2/);
    });

    it('should exit agent_worker when master die in accident', async () => {
      app = utils.cluster('apps/agent-die');
      await app
        // .debug()
        .expect('stdout', /\[master\] egg started on http:\/\/127.0.0.1:\d+/)
        .end();

      // kill -9 master
      app.process.kill('SIGKILL');
      await sleep(5000);
      app.expect('stderr', /\[app_worker\] receive disconnect event in cluster fork mode, exitedAfterDisconnect:false/)
        .expect('stderr', /\[agent_worker\] receive disconnect event on child_process fork mode, exiting with code:110/)
        .expect('stderr', /\[agent_worker\] exit with code:110/);
    });

    it('should master exit when agent exit during app worker boot', () => {
      app = utils.cluster('apps/agent-die-on-forkapp');

      return app
        // .debug()
        .expect('code', 1)
        .expect('stdout', /\[master\] agent_worker#1:\d+ started/)
        .expect('stderr', /\[master\] agent_worker#1:\d+ died/)
        .expect('stderr', /\[master\] agent_worker#1:\d+ start fail, exiting with code:1/)
        .expect('stderr', /\[master\] exit with code:1/)
        .notExpect('stdout', /app_worker#2/)
        .end();
    });

    it('should exit when emit error during agent worker boot', () => {
      app = utils.cluster('apps/agent-start-error');
      return app
        // .debug()
        .expect('code', 1)
        .expect('stderr', /mock error/)
        .expect('stderr', /\[agent_worker\] start error, exiting with code:1/)
        .expect('stderr', /\[master\] exit with code:1/)
        .end();
    });

    it('should FrameworkErrorformater work during agent boot', () => {
      app = utils.cluster('apps/agent-start-framework-error');
      return app
        // .debug()
        .expect('code', 1)
        .expect('stderr', /CustomError: mock error \[ https\:\/\/eggjs\.org\/zh-cn\/faq\/customPlugin_99 \]/)
        .end();
    });

    it('should FrameworkErrorformater work during agent boot ready', () => {
      app = utils.cluster('apps/agent-start-framework-ready-error');
      return app
        // .debug()
        .expect('code', 1)
        .expect('stderr', /CustomError: mock error \[ https\:\/\/eggjs\.org\/zh-cn\/faq\/customPlugin_99 \]/)
        .end();
    });

    // process.send is not exist if started by spawn
    it('master should not die if spawn error', async () => {
      app = coffee.spawn('node', [ utils.getFilepath('apps/agent-die/start.js') ]);
      // app.debug();
      app.close = () => app.proc.kill();

      await sleep(3000);
      app.emit('close', 0);
      app.expect('stderr', /Error: Cannot find module/);
      app.notExpect('stderr', /TypeError: process.send is not a function/);
    });
  });

  describe('agent custom loggers', () => {
    before(() => {
      app = utils.cluster('apps/custom-logger');
      return app.ready();
    });
    after(() => app.close());

    it('should support custom logger in agent', async () => {
      await sleep(1500);
      const content = await readFile(
        path.join(__dirname, 'fixtures/apps/custom-logger/logs/monitor.log'), 'utf8');
      assert(content === 'hello monitor!\n');
    });
  });
});
