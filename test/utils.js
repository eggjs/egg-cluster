'use strict';

const path = require('path');
const mm = require('egg-mock');

exports.cluster = function(name, options) {
  options = Object.assign({}, {
    baseDir: name,
    customEgg: path.join(__dirname, './fixtures/egg'),
    eggPath: path.dirname(require.resolve('egg')),
    cache: false,
  }, options);
  console.log('###', require.extensions, options);
  return mm.cluster(options);
};

exports.getFilepath = function(name) {
  return path.join(__dirname, 'fixtures', name);
};
