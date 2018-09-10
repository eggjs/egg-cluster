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
      const ret = parseTLSOpts(true);
      assert(typeof ret === 'undefined');
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

    it('with https:key/cert by file type', () => {
      const key = join(__dirname, 'fixtures/server.key');
      const cert = join(__dirname, 'fixtures/server.crt');
      const opts = {
        key,
        cert,
      };
      const ret = parseTLSOpts(opts);

      assert(ret && Object.keys(ret).length === 2);
      assert(ret.key === key);
      assert(ret.cert === cert);
    });

    it('with https:key/cert by Buffer type', () => {
      const key = join(__dirname, 'fixtures/server.key');
      const cert = join(__dirname, 'fixtures/server.crt');
      const opts = {
        key: readFileSync(key),
        cert: readFileSync(cert),
      };
      const ret = parseTLSOpts(opts);

      assert(ret && Object.keys(ret).length === 2);
      assert(ret.key.toString() === opts.key.toString());
      assert(ret.cert.toString() === opts.cert.toString());
    });
  });


  describe('Should mergeTLSOpts()', () => {
    it('with both optionsHttps and listenHttps invalid', () => {
      let ret = mergeTLSOpts(true, true);
      assert(typeof ret === 'undefined');

      ret = mergeTLSOpts({}, {});
      assert(typeof ret === 'undefined');

      ret = mergeTLSOpts({});
      assert(typeof ret === 'undefined');

      ret = mergeTLSOpts(true);
      assert(typeof ret === 'undefined');

      ret = mergeTLSOpts();
      assert(typeof ret === 'undefined');
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

      ret = mergeTLSOpts(true, opts);
      assert(ret && Object.keys(ret).length === 2);
      assert(ret && ret.key === opts.key && ret.cert === opts.cert);

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
