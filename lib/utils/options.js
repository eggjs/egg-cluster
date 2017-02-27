'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

module.exports = function(options) {
  const defaults = {
    customEgg: '',
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

  options.framework = getFrameworkPath(options);
  const egg = require(options.framework);
  assert(egg.Application, 'should define Application in customEgg');
  assert(egg.Agent, 'should define Agent in customEgg');

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

function getFrameworkPath(options) {
  const framework = options.customEgg || options.framework;
  const moduleDir = path.join(options.baseDir, 'node_modules');

  // 1. pass framework or customEgg
  if (framework) {
    // 1.1 framework is an absolute path
    // framework: path.join(baseDir, 'node_modules/${frameworkName}')
    if (path.isAbsolute(framework)) return assertAndReturn(framework);
    // 1.2 framework is a npm package that required by application
    // framework: 'frameworkName'
    return assertAndReturn(path.join(moduleDir, framework));
  }

  // 2. framework is not specified
  // 2.1 use framework name from pkg.egg.framework
  const pkg = require(path.join(options.baseDir, 'package.json'));
  if (pkg.egg && pkg.egg.framework) {
    return assertAndReturn(path.join(moduleDir, pkg.egg.framework));
  }

  // 2.2 use egg by default
  return assertAndReturn(path.join(moduleDir, 'egg'));
}

function assertAndReturn(frameworkPath) {
  assert(fs.existsSync(frameworkPath), `${frameworkPath} should exist`);
  return frameworkPath;
}
