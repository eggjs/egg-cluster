'use strict';

const os = require('os');
const fs = require('fs');
const assert = require('assert');

module.exports = function(options) {
  const defaults = {
    customEgg: '',
    eggPath: '',
    baseDir: process.cwd(),
    port: options.https ? 8443 : 7001,
    workers: null,
    antxpath: '',
    plugins: null,
    https: false,
    key: '',
    cert: '',
  };
  options = extend(defaults, options);
  if (!options.workers) {
    options.workers = os.cpus().length;
  }

  assert(options.eggPath && fs.existsSync(options.eggPath), 'options.eggPath should exists');
  const egg = require(options.eggPath);
  assert(egg.Application, 'should define Application in customEgg');
  assert(egg.Agent, 'should define Agent in customEgg');

  if (!options.customEgg) {
    options.customEgg = options.eggPath;
  }

  if (options.https) {
    assert(options.key && fs.existsSync(options.key), 'options.key should exists');
    assert(options.cert && fs.existsSync(options.cert), 'options.cert should exists');
  }

  options.port = parseInt(options.port, 10);
  options.workers = parseInt(options.workers, 10);

  // don't print depd message in production env.
  // it will print to stderr.
  if (process.env.NODE_ENV === 'production') {
    process.env.NO_DEPRECATION = '*';
  }

  return options;
};

function extend(target, src) {
  const keys = Object.keys(src);
  for (const key of keys) {
    if (src[key] != null) {
      target[key] = src[key];
    }
  }
  return target;
}
