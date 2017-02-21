'use strict';

const mm = require('egg-mock');
const request = require('supertest');
const utils = require('./utils');

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
    after(() => {
      mm.restore();
      app.close();
    });
    it('should restart', done => {
      request(app.callback())
      .get('/exit')
      // wait app worker restart
      .end(() => setTimeout(() => {
        app.expect('stdout', /App Worker#1:\d+ disconnect/);
        app.expect('stderr', /nodejs.AppWorkerDiedError: \[master\]/);
        app.expect('stderr', /App Worker#1:\d+ died/);
        app.expect('stdout', /App Worker#2:\d+ started/);

        done();
      // wait to run coverage
      }, 10000));
    });
  });


  describe('app worker error when env === "local"', () => {
    before(() => {
      mm.env('local');
      app = utils.cluster('apps/app-die');
      app.debug(false);
      return app.ready();
    });
    after(() => {
      mm.restore();
      app.close();
    });
    it('should restart', done => {
      request(app.callback())
      .get('/exit')
      // wait app worker restart
      .end(() => setTimeout(() => {
        app.expect('stdout', /App Worker#1:\d+ disconnect/);
        app.expect('stderr', /don't fork new work/);
        done();
      }, 5000));
    });
  });

  describe('app worker kill when env === "local"', () => {
    before(() => {
      mm.env('local');
      app = utils.cluster('apps/app-kill', { opt: { execArgv: [ '--debug' ] } });
      app.debug(false);
      return app.ready();
    });
    after(() => {
      mm.restore();
      app.close();
    });
    it('should exit', done => {
      request(app.callback())
        .get('/kill?signal=SIGKILL')
        // wait app worker restart
        .end(() => setTimeout(() => {
          app.expect('stdout', /App Worker#1:\d+ disconnect/);
          app.expect('stderr', /Debugger listening on/);
          app.expect('stderr', /don't fork new work/);
          app.expect('stderr', /\[master\] kill by debugger/);
          done();
        }, 3000));
    });
  });

  describe('app start timeout', () => {
    it('should exit', function(done) {
      app = utils.cluster('apps/app-start-timeout');
      app.expect('code', 1)
      .expect('stderr', /\[master\] worker start fail, exit now/)
      .expect('stderr', /\[app_worker\] App Worker start timeout, exiting now!/)
      .expect('stderr', /nodejs.AppWorkerDiedError: \[master\]/)
      .expect('stderr', /App Worker#1:\d+ died/)
      .end(done);
    });
  });

});
