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
    port: options.https ? 8443 : 7001,
    workers: null,
    plugins: null,
    https: false,
    key: '',
    cert: '',
    opt: {
      execArgv: process.execArgv,
    },
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

  options.port = parseInt(options.port, 10);
  options.workers = parseInt(options.workers, 10);

  // don't print depd message in production env.
  // it will print to stderr.
  if (process.env.NODE_ENV === 'production') {
    process.env.NO_DEPRECATION = '*';
  }

  // node 6 fail with `Generator is already running` when harmony v8 option on
  const idx = options.opt.execArgv.indexOf('--harmony');
  if (Number(process.versions.modules) < 48) {
    if (idx === -1) {
      options.opt.execArgv.push('--harmony');
    }
  } else {
    if (idx >= 0) {
      options.opt.execArgv.splice(idx, 1);
    }
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
