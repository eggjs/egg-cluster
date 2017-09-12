'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const utils = require('egg-utils');


module.exports = function(options) {
  const defaults = {
    framework: '',
    baseDir: process.cwd(),
    port: options.https ? 8443 : null,
    workers: null,
    plugins: null,
    https: false,
    key: '',
    cert: '',
  };
  options = extend(defaults, options);
  if (!options.workers) {
    options.workers = os.cpus().length;
  }

  const pkgPath = path.join(options.baseDir, 'package.json');
  assert(fs.existsSync(pkgPath), `${pkgPath} should exist`);

  options.framework = utils.getFrameworkPath({
    baseDir: options.baseDir,
    // compatible customEgg only when call startCluster directly without framework
    framework: options.framework || options.customEgg,
  });

  const egg = require(options.framework);
  assert(egg.Application, `should define Application in ${options.framework}`);
  assert(egg.Agent, `should define Agent in ${options.framework}`);

  if (options.https) {
    assert(options.key && fs.existsSync(options.key), 'options.key should exists');
    assert(options.cert && fs.existsSync(options.cert), 'options.cert should exists');
  }

  options.port = parseInt(options.port, 10) || undefined;
  options.workers = parseInt(options.workers, 10);

  // don't print depd message in production env.
  // it will print to stderr.
  if (process.env.NODE_ENV === 'production') {
    process.env.NO_DEPRECATION = '*';
  }

  const isDebug = process.execArgv.some(argv => argv.includes('--debug') || argv.includes('--inspect'));
  if (isDebug) options.isDebug = isDebug;

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
