'use strict';

const fs = require('fs');
const assert = require('assert');
const deprecate = require('depd')('egg');

/**
 * Parse TLS SecureContextOptions
 *
 * @param {SecureContextOptions|void} options tls
 * @return {SecureContextOptions|void} parsed options
 */
function parseTLSOpts(options) {
  if (options === true) {
    const msg = '[master] Deprecated: Please use `https: { key, cert }` instead of `https: true`. Docs: https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options';
    deprecate(msg);
    return;
  } else if (!options) {
    return;
  }

  const opts = Object.assign({}, options);

  /* istanbul ignore else */
  if (typeof opts.ca === 'string') {
    assert(opts.ca && fs.existsSync(opts.ca), 'File of https.ca should exists');
  }
  /* istanbul ignore else */
  if (typeof opts.cert === 'string') {
    assert(opts.cert && fs.existsSync(opts.cert), 'File of https.cert should exists');
  }
  /* istanbul ignore else */
  if (typeof opts.key === 'string') {
    assert(opts.key && fs.existsSync(opts.key), 'File of https.key should exists');
  }
  /* istanbul ignore else */
  if (typeof opts.pfx === 'string') {
    assert(opts.pfx && fs.existsSync(opts.pfx), 'File of https.pfx should exists');
  }

  return opts;
}


/**
 * Merge TLS options. first param with higher priority
 *
 * @param {SecureContextOptions|void} optionsHttp from options
 * @param {SecureContextOptions|void} listenHttp from listenConfig
 * @return {SecureContextOptions|void} merged
 */
function mergeTLSOpts(optionsHttp, listenHttp) {
  const ret = { };

  /* istanbul ignore else */
  if (listenHttp && typeof listenHttp === 'object') {
    Object.assign(ret, listenHttp);
  }
  /* istanbul ignore else */
  if (optionsHttp && typeof optionsHttp === 'object') {
    Object.assign(ret, optionsHttp);
  }

  if (Object.keys(ret).length) {
    return ret;
  }
}


module.exports = {
  mergeTLSOpts,
  parseTLSOpts,
};
