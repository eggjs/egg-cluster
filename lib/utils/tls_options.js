'use strict';

const fs = require('fs');
const assert = require('assert');

/**
 * Parse TLS SecureContextOptions
 *
 * @param {SecureContextOptions|void} options tls
 * @return {SecureContextOptions|void} parsed options
 */
function parseTLSOpts(options) {
  const msg = '[master] Deprecated: Please use `https: { key, cert }` instead of `https: true`. Docs: https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options';
  assert(!(options === true), msg);

  if (!options) {
    return;
  }
  const opts = Object.assign({}, options);

  /* istanbul ignore else */
  if (typeof opts.ca === 'string') {
    assert(opts.ca && fs.existsSync(opts.ca), `File of https.ca should exists: "${opts.ca}"`);
    opts.ca = fs.readFileSync(opts.ca);
  }
  /* istanbul ignore else */
  if (typeof opts.cert === 'string') {
    assert(opts.cert && fs.existsSync(opts.cert), `File of https.cert should exists: "${opts.cert}"`);
    opts.cert = fs.readFileSync(opts.cert);
  }
  /* istanbul ignore else */
  if (typeof opts.key === 'string') {
    assert(opts.key && fs.existsSync(opts.key), `File of https.key should exists: "${opts.key}"`);
    opts.key = fs.readFileSync(opts.key);
  }
  /* istanbul ignore else */
  if (typeof opts.pfx === 'string') {
    assert(opts.pfx && fs.existsSync(opts.pfx), `File of https.pfx should exists: "${opts.pfx}"`);
    opts.pfx = fs.readFileSync(opts.pfx);
  }

  if (Object.keys(opts).length) {
    return opts;
  }
}


/**
 * Merge TLS options. first param with higher priority
 *
 * @param {SecureContextOptions|void} optionsHttps from options
 * @param {SecureContextOptions|void} listenHttps from listenConfig
 * @return {SecureContextOptions|void} merged
 */
function mergeTLSOpts(optionsHttps, listenHttps) {
  const ret = { };
  const msg = '[master] Deprecated: Please use `https: { key, cert }` instead of `https: true`. Docs: https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options';

  assert(!(optionsHttps === true), msg);
  assert(!(listenHttps === true), msg);

  /* istanbul ignore else */
  if (listenHttps && typeof listenHttps === 'object') {
    Object.assign(ret, listenHttps);
  }
  /* istanbul ignore else */
  if (optionsHttps && typeof optionsHttps === 'object') {
    Object.assign(ret, optionsHttps);
  }

  if (Object.keys(ret).length) {
    return ret;
  }
}


module.exports = {
  mergeTLSOpts,
  parseTLSOpts,
};
