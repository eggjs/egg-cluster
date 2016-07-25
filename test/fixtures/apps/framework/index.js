'use strict';

const egg = require('egg');

module.exports = egg;
module.exports.Application = require('./lib/framework');
module.exports.Agent = require('./lib/agent');
