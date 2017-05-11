'use strict';

const mm = require('egg-mock');
const request = require('supertest');
const sleep = require('mz-modules/sleep');
const utils = require('./utils');
const format = require('util').format;

describe('test/lib/cluster/app_worker.test.js', () => {

  let app;
  afterEach(() => app.close());

  describe('app worker', () => {
    before(() => {
      app = utils.cluster('apps/app-server');
      return app.ready();
    });
    it('should emit `server`', done => {
      request(app.callback())
      .get('/')
      .expect('true', done);
    });
  });

  it('should exit when app worker error during boot', done => {
    app = utils.cluster('apps/worker-die');
    app.debug(false)
    .expect('code', 1)
    .end(done);
  });

  it('should exit when emit error during app worker boot', function(done) {
    app = utils.cluster('apps/app-start-error');
    app.debug(false)
    .expect('code', 1)
    .end(done);
  });

  it('should remove error listener after ready', function* () {
    app = utils.cluster('apps/app-error-listeners');
    yield app.ready();
    yield request(app.callback())
    .get('/')
    .expect({
      beforeReady: 2,
      afterReady: 1,
    });
    yield app.close();
  });

  it('should ignore listen to other port', done => {
    app = utils.cluster('apps/other-port');
    app.notExpect('stdout', /started at 7002/).end(done);
  });

  describe('app worker error in env === "default"', () => {
    before(() => {
      mm.env('default');
      app = utils.cluster('apps/app-die');
      app.debug(false);
      return app.ready();
    });
    after(mm.restore);

    it('should restart', function* () {
      try {
        yield request(app.callback())
        .get('/exit');
      } catch (_) {
        // ignore
      }

      // wait app worker restart
      yield sleep(10000);

      app.expect('stdout', /App Worker#1:\d+ disconnect/);
      app.expect('stderr', /nodejs.AppWorkerDiedError: \[master\]/);
      app.expect('stderr', /App Worker#1:\d+ died/);
      app.expect('stdout', /App Worker#2:\d+ started/);
    });
  });


  describe('app worker error when env === "local"', () => {
    before(() => {
      mm.env('local');
      app = utils.cluster('apps/app-die');
      app.debug(false);
      return app.ready();
    });
    after(mm.restore);

    it('should restart', function* () {
      try {
        yield request(app.callback())
        .get('/exit');
      } catch (_) {
        // ignore
      }

      // wait app worker restart
      yield sleep(5000);

      app.expect('stdout', /App Worker#1:\d+ disconnect/);
      app.expect('stderr', /don't fork new work/);
    });
  });

  describe('app worker kill when env === "local"', () => {
    before(() => {
      mm.env('local');
      app = utils.cluster('apps/app-kill', { opt: { execArgv: [ '--debug' ] } });
      app.debug(false);
      return app.ready();
    });
    after(mm.restore);

    it('should exit', function* () {
      try {
        yield request(app.callback())
          .get('/kill?signal=SIGKILL');
      } catch (_) {
        // ignore
      }

      // wait app worker restart
      yield sleep(3000);

      app.expect('stdout', /App Worker#1:\d+ disconnect/);
      app.expect('stderr', /Debugger listening on/);
      app.expect('stderr', /don't fork new work/);
      app.expect('stderr', /\[master\] kill by debugger/);
    });
  });

  describe('app start timeout', () => {
    it('should exit', function(done) {
      app = utils.cluster('apps/app-start-timeout');
      app
        .debug(false)
        .expect('code', 1)
        .expect('stderr', /\[master\] worker start fail, exit now/)
        .expect('stderr', /\[app_worker\] App Worker start timeout, exiting now!/)
        .expect('stderr', /nodejs.AppWorkerDiedError: \[master\]/)
        .expect('stderr', /App Worker#1:\d+ died/)
        .end(done);
    });
  });

  describe('app worker with appWorkBrk', () => {
    it('should append execArgv to the app work', function(done) {
      const brkConfig = [ '--debug-brk' ];
      app = utils.cluster('apps/app-debug-brk', {
        opt: { execArgv: [ '--debug' ] },
        appWorkBrk: true,
      });
      const expectString = format(
        'App Worker start with execArgv: %s', brkConfig);
      let called = false;
      app.on('stdout_data', function(buf) {
        const out = buf.toString();
        if (out.indexOf(expectString) > -1 && !called) {
          called = true;
          done();
        }
        // https://github.com/Microsoft/vscode/issues/5831
      });
    });
  });

});
