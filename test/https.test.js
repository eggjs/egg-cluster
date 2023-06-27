const assert = require('assert');
const path = require('path');
const mm = require('egg-mock');
const urllib = require('urllib');
const utils = require('./utils');

const httpclient = new urllib.HttpClient({ connect: { rejectUnauthorized: false } });

describe('test/https.test.js', () => {
  let app;
  afterEach(mm.restore);

  describe('start https server with cluster options', () => {
    afterEach(() => app && app.close());

    it('should success with status 200', async () => {
      const baseDir = path.join(__dirname, 'fixtures/apps/https-server');
      const options = {
        baseDir,
        port: 8443,
        https: {
          key: utils.getFilepath('server.key'),
          cert: utils.getFilepath('server.cert'),
          ca: utils.getFilepath('server.ca'),
        },
      };
      app = utils.cluster('apps/https-server', options);
      await app.ready();

      const response = await httpclient.request('https://127.0.0.1:8443', {
        dataType: 'text',
        rejectUnauthorized: false,
      });

      assert(response.status === 200);
      assert(response.data === 'https server');
    });

    it('should listen https and http at the same time', async () => {
      const baseDir = path.join(__dirname, 'fixtures/apps/https-server');
      const options = {
        baseDir,
        debugPort: 7001,
        port: 8443,
        https: {
          key: utils.getFilepath('server.key'),
          cert: utils.getFilepath('server.cert'),
          ca: utils.getFilepath('server.ca'),
        },
      };
      app = utils.cluster('apps/https-server', options);
      await app.ready();

      let response = await httpclient.request('https://127.0.0.1:8443', {
        dataType: 'text',
      });
      assert(response.status === 200);
      assert(response.data === 'https server');

      response = await httpclient.request('http://127.0.0.1:7001', {
        dataType: 'text',
      });
      assert(response.status === 200);
      assert(response.data === 'https server');
    });
  });

  describe('start https server with app config cluster', () => {
    afterEach(() => app && app.close());

    it('should success with status 200', async () => {
      const baseDir = path.join(__dirname, 'fixtures/apps/https-server-config');
      const options = {
        baseDir,
        port: 8443,
      };

      app = utils.cluster('apps/https-server-config', options);
      await app.ready();

      const response = await httpclient.request('https://127.0.0.1:8443', {
        dataType: 'text',
        rejectUnauthorized: false,
      });

      assert(response.status === 200);
      assert(response.data === 'https server config');
    });
  });
});
