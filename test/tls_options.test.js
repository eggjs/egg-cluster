'use strict';

const readFileSync = require('fs').readFileSync;
const join = require('path').join;
const assert = require('assert');
const tlsUtil = require('../lib/utils/tls_options');
const mergeTLSOpts = tlsUtil.mergeTLSOpts;
const parseTLSOpts = tlsUtil.parseTLSOpts;

describe('test/tls_options.test.js', () => {
  describe('Should parseTLSOpts()', () => {
    it('with https:true', () => {
      assert.throws(() => parseTLSOpts(true));
    });

    it('with https:false', () => {
      const ret = parseTLSOpts(false);
      assert(typeof ret === 'undefined');
    });

    it('with https:{}', () => {
      const ret = parseTLSOpts({});
      assert(typeof ret === 'undefined');
    });

    it('with https:undefined', () => {
      const ret = parseTLSOpts();
      assert(typeof ret === 'undefined');
    });

    it('with invalid https.ca file path', () => {
      const opts = {
        ca: Math.random().toString(),
      };
      assert.throws(
        () => parseTLSOpts(opts),
        new RegExp(`File of https.ca should exists: "${opts.ca}"`)
      );

      opts.ca = '';
      assert.throws(
        () => parseTLSOpts(opts),
        new RegExp(`File of https.ca should exists: "${opts.ca}"`)
      );
    });

    it('with invalid https.cert file path', () => {
      const opts = {
        cert: Math.random().toString(),
      };
      assert.throws(
        () => parseTLSOpts(opts),
        new RegExp(`File of https.cert should exists: "${opts.cert}"`)
      );

      opts.cert = '';
      assert.throws(
        () => parseTLSOpts(opts),
        new RegExp(`File of https.cert should exists: "${opts.cert}"`)
      );
    });

    it('with invalid https.key file path', () => {
      const opts = {
        key: Math.random().toString(),
      };
      assert.throws(
        () => parseTLSOpts(opts),
        new RegExp(`File of https.key should exists: "${opts.key}"`)
      );

      opts.key = '';
      assert.throws(
        () => parseTLSOpts(opts),
        new RegExp(`File of https.key should exists: "${opts.key}"`)
      );
    });

    it('with invalid https.pfx file path', () => {
      const opts = {
        pfx: Math.random().toString(),
      };
      assert.throws(
        () => parseTLSOpts(opts),
        new RegExp(`File of https.pfx should exists: "${opts.pfx}"`)
      );

      opts.pfx = '';
      assert.throws(
        () => parseTLSOpts(opts),
        new RegExp(`File of https.pfx should exists: "${opts.pfx}"`)
      );
    });

    it('with https:key/cert by file path', () => {
      const key = join(__dirname, 'fixtures/server.key');
      const cert = join(__dirname, 'fixtures/server.crt');
      const pfx = join(__dirname, 'fixtures/server.crt');
      const opts = {
        key,
        cert,
        pfx,
      };
      const ret = parseTLSOpts(opts);

      assert(ret && Object.keys(ret).length === 3);
      assert(ret.key.toString() === readFileSync(key).toString());
      assert(ret.cert.toString() === readFileSync(cert).toString());
      assert(ret.pfx.toString() === readFileSync(cert).toString());
    });

    it('with https:key/cert by Buffer', () => {
      const key = join(__dirname, 'fixtures/server.key');
      const cert = join(__dirname, 'fixtures/server.crt');
      const opts = {
        key: readFileSync(key),
        cert: readFileSync(cert),
        pfx: readFileSync(cert),
      };
      const ret = parseTLSOpts(opts);

      assert(ret && Object.keys(ret).length === 3);
      assert(ret.key.toString() === opts.key.toString());
      assert(ret.cert.toString() === opts.cert.toString());
      assert(ret.pfx.toString() === opts.pfx.toString());
    });
  });


  describe('Should mergeTLSOpts()', () => {
    it('with both optionsHttps and listenHttps invalid', () => {
      let ret = mergeTLSOpts({}, {});
      assert(typeof ret === 'undefined');

      ret = mergeTLSOpts({});
      assert(typeof ret === 'undefined');

      ret = mergeTLSOpts();
      assert(typeof ret === 'undefined');

      assert.throws(() => mergeTLSOpts(true));
      assert.throws(() => mergeTLSOpts(true, true));
    });

    it('with valid optionsHttps and invalid listenHttps', () => {
      const opts = {
        key: Math.random().toString(),
        cert: Math.random().toString(),
      };
      const ret = mergeTLSOpts(opts, {});

      assert(ret && Object.keys(ret).length === 2);
      assert(ret && ret.key === opts.key && ret.cert === opts.cert);
    });

    it('with invalid optionsHttps and valid listenHttps', () => {
      const opts = {
        key: Math.random().toString(),
        cert: Math.random().toString(),
      };
      let ret = mergeTLSOpts({}, opts);
      assert(ret && Object.keys(ret).length === 2);
      assert(ret && ret.key === opts.key && ret.cert === opts.cert);

      assert.throws(() => mergeTLSOpts(true, opts));

      ret = mergeTLSOpts(false, opts);
      assert(ret && Object.keys(ret).length === 2);
      assert(ret && ret.key === opts.key && ret.cert === opts.cert);
    });

    it('with both optionsHttps and listenHttps valid', () => {
      const optionsHttps = {
        key: Math.random().toString(),
        cert: Math.random().toString(),
      };
      const listenHttps = {
        key: Math.random().toString(),
        cert: Math.random().toString(),
        ca: Math.random().toString(),
      };
      const ret = mergeTLSOpts(optionsHttps, listenHttps);

      assert(ret && Object.keys(ret).length === 3);
      assert(ret
        && ret.key === optionsHttps.key
        && ret.cert === optionsHttps.cert
        && ret.ca === listenHttps.ca
      );
    });
  });

});
