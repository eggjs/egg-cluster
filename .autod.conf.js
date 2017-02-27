'use strict';

module.exports = {
  write: true,
  prefix: '^',
  devprefix: '^',
  exclude: [
    'test/fixtures',
  ],
  devdep: [
    'autod',
    'egg',
    'egg-bin',
    'egg-ci',
    'eslint',
    'eslint-config-egg',
  ]
};
