'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const utils = require('egg-utils');
const semver = require('semver');

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

  // format debug args
  const isDebug = options.debug || options.debugBrk || options.debugAgent || options.debugAgentBrk;
  if (isDebug) {
    const isNew = semver.gte(process.version, '8.0.0');
    options.debugProtocol = isNew ? 'inspect' : 'debug';
    const defaultDebugPort = isNew ? 9229 : 5858;

    // if provide `debugBrk` without `debug`, then set it to `debug`
    if (!options.debug && options.debugBrk) options.debug = options.debugBrk;
    // if don't provide port, then use default
    if (options.debug === true) options.debug = defaultDebugPort;
    // normalize to boolean
    options.debugBrk = !!options.debugBrk;

    // if provide `debugAgentBrk` without `debugAgent`, then set it to `debugAgent`
    if (!options.debugAgent && options.debugAgentBrk) options.debugAgent = options.debugAgentBrk;
    // if don't provide port, then use default - 2
    if (options.debugAgent === true) options.debugAgent = (options.debug || defaultDebugPort) - 2;
    // normalize to boolean
    options.debugAgentBrk = !!options.debugAgentBrk;
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
