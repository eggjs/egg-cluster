'use strict';

const path = require('path');
const egg = require('egg');
const Agent = egg.Agent;

class FrameworkAgent extends Agent {
  get [Symbol.for('egg#eggPath')]() {
    return path.join(__dirname, '..');
  }
}

module.exports = FrameworkAgent;
