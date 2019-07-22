'use strict';

const assert = require('assert');
const mm = require('egg-mock');
const urllib = require('urllib');
const path = require('path');
const utils = require('./utils');

describe('test/https.test.js', () => {
  let app;

  afterEach(mm.restore);

  describe('start https server with cluster options', () => {
    afterEach(() => app.close());

    it('should success with status 200', function* () {

      const baseDir = path.join(__dirname, 'fixtures/apps/https-server');
      const options = {
        baseDir,
        port: 8443,
        https: {
          key: utils.getFilepath('server.key'),
          cert: utils.getFilepath('server.cert'),
        },
      };
      app = utils.cluster('apps/https-server', options);
      yield app.ready();

      const response = yield urllib.request('https://127.0.0.1:8443', {
        dataType: 'text',
        rejectUnauthorized: false,
      });

      assert(response.status === 200);
      assert(response.data === 'https server');
    });

  });

  describe('start https server with app config cluster', () => {
    afterEach(() => app.close());

    it('should success with status 200', function* () {
      const baseDir = path.join(__dirname, 'fixtures/apps/https-server-config');
      const options = {
        baseDir,
        port: 8443,
      };

      app = utils.cluster('apps/https-server-config', options);
      yield app.ready();

      const response = yield urllib.request('https://127.0.0.1:8443', {
        dataType: 'text',
        rejectUnauthorized: false,
      });

      assert(response.status === 200);
      assert(response.data === 'https server config');
    });
  });
});
