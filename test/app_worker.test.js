'use strict';

const mm = require('egg-mock');
const sleep = require('mz-modules/sleep');
const rimraf = require('mz-modules/rimraf');
const request = require('supertest');
const address = require('address');
const assert = require('assert');
const utils = require('./utils');

describe('test/app_worker.test.js', () => {
  let app;
  afterEach(() => app.close());

  describe('app worker', () => {
    before(() => {
      app = utils.cluster('apps/app-server');
      return app.ready();
    });
    it('should emit `server`', () => {
      return app.httpRequest()
        .get('/')
        .expect('true');
    });
  });

  describe('app worker error', () => {
    it('should exit when app worker error during boot', () => {
      app = utils.cluster('apps/worker-die');

      return app
        // .debug()
        .expect('code', 1)
        .end();
    });

    it('should exit when emit error during app worker boot', () => {
      app = utils.cluster('apps/app-start-error');

      return app
        // .debug()
        .expect('code', 1)
        .end();
    });

    it('should remove error listener after ready', function* () {
      app = utils.cluster('apps/app-error-listeners');
      yield app.ready();
      yield app.httpRequest()
        .get('/')
        .expect({
          beforeReady: 2,
          afterReady: 1,
        });
      yield app.close();
    });

    it('should ignore listen to other port', done => {
      app = utils.cluster('apps/other-port');
      // app.debug();
      app.notExpect('stdout', /started at 7002/).end(done);
    });
  });

  describe('app worker error in env === "default"', () => {
    before(() => {
      mm.env('default');
      app = utils.cluster('apps/app-die');
      // app.debug();
      return app.ready();
    });
    after(mm.restore);

    it('should restart', function* () {
      try {
        yield app.httpRequest()
          .get('/exit');
      } catch (_) {
        // ignore
      }

      // wait app worker restart
      yield sleep(15000);

      app.expect('stdout', /app_worker#1:\d+ disconnect/);
      app.expect('stderr', /nodejs.AppWorkerDiedError: \[master\]/);
      app.expect('stderr', /app_worker#1:\d+ died/);
      app.expect('stdout', /app_worker#2:\d+ started/);
    });
  });

  describe('app worker error when env === "local"', () => {
    before(() => {
      mm.env('local');
      app = utils.cluster('apps/app-die');
      // app.debug();
      return app.ready();
    });
    after(mm.restore);

    it('should restart', function* () {
      try {
        yield app.httpRequest()
          .get('/exit');
      } catch (_) {
        // ignore
      }

      // wait app worker restart
      yield sleep(10000);

      app.expect('stdout', /app_worker#1:\d+ disconnect/);
      app.expect('stderr', /don't fork new work/);
    });
  });

  describe('app worker kill when env === "local"', () => {
    before(() => {
      mm.env('local');
      app = utils.cluster('apps/app-kill');
      // app.debug();
      return app.ready();
    });
    after(mm.restore);

    it('should exit', function* () {
      try {
        yield app.httpRequest()
          .get('/kill?signal=SIGKILL');
      } catch (_) {
        // ignore
      }

      // wait app worker restart
      yield sleep(10000);

      app.expect('stdout', /app_worker#1:\d+ disconnect/);
      app.expect('stderr', /don't fork new work/);
    });
  });

  describe('app start timeout', () => {
    it('should exit', () => {
      app = utils.cluster('apps/app-start-timeout');
      return app
        // .debug()
        .expect('code', 1)
        .expect('stderr', /\[master\] app_worker#1:\d+ start fail, exiting with code:1/)
        .expect('stderr', /\[app_worker\] start timeout, exiting with code:1/)
        .expect('stderr', /nodejs.AppWorkerDiedError: \[master\]/)
        .expect('stderr', /app_worker#1:\d+ died/)
        .end();
    });
  });

  describe('listen config', () => {
    const sockFile = utils.getFilepath('apps/app-listen-path/my.sock');
    beforeEach(() => {
      mm.env('default');
    });
    afterEach(mm.restore);
    afterEach(() => rimraf(sockFile));

    it('should error then port is not specified', function* () {
      app = utils.cluster('apps/app-listen-without-port');
      // app.debug();
      yield app.ready();

      app.expect('code', 1);
      app.expect('stderr', /port should be number, but got undefined/);
    });

    it('should use port in config', function* () {
      app = utils.cluster('apps/app-listen-port');
      app.debug();
      yield app.ready();

      app.expect('code', 0);
      app.expect('stdout', /egg started on http:\/\/127.0.0.1:17010/);

      yield request('http://127.0.0.1:17010')
        .get('/')
        .expect('done')
        .expect(200);

      yield request('http://127.0.0.1:17010')
        .get('/')
        .expect('done')
        .expect(200);

      yield request('http://localhost:17010')
        .get('/')
        .expect('done')
        .expect(200);
    });

    it('should use hostname in config', function* () {
      const url = address.ip() + ':17010';

      app = utils.cluster('apps/app-listen-hostname');
      // app.debug();
      yield app.ready();

      app.expect('code', 0);
      app.expect('stdout', new RegExp(`egg started on http://${url}`));

      yield request(url)
        .get('/')
        .expect('done')
        .expect(200);

      try {
        yield request('http://127.0.0.1:17010')
          .get('/')
          .expect('done')
          .expect(200);
        throw new Error('should not run');
      } catch (err) {
        assert(err.message === 'ECONNREFUSED: Connection refused');
      }
    });

    it('should use path in config', function* () {
      app = utils.cluster('apps/app-listen-path');
      app.debug();
      yield app.ready();

      app.expect('code', 0);
      app.expect('stdout', new RegExp(`egg started on ${sockFile}`));

      const sock = encodeURIComponent(sockFile);
      yield request(`http+unix://${sock}`)
        .get('/')
        .expect('done')
        .expect(200);
    });
  });

});
