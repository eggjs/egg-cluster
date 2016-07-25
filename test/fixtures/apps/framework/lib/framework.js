'use strict';

const path = require('path');
const egg = require('egg');
const Application = egg.Application;
const AppWorkerLoader = egg.AppWorkerLoader;

class Loader extends AppWorkerLoader {
  loadConfig() {
    this.loadServerConf();
    super.loadConfig();
  }

  loadServerConf() {}
}

class ChairApplication extends Application {
  get [Symbol.for('egg#eggPath')]() {
    return path.join(__dirname, '..');
  }

  get [Symbol.for('egg#loader')]() {
    return Loader;
  }
}

module.exports = ChairApplication;
