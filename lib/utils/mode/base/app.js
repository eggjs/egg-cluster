/* istanbul ignore file */
'use strict';

const path = require('path');
const EventEmitter = require('events').EventEmitter;

class BaseAppWorker {
  constructor(instance) {
    this.instance = instance;
  }

  get id() {
    throw new Error('BaseAppWorker should implement getter id.');
  }

  get workerId() {
    throw new Error('BaseAppWorker should implement getter workerId.');
  }

  get state() {
    throw new Error('BaseAppWorker should implement getter state.');
  }

  get exitedAfterDisconnect() {
    throw new Error('BaseAppWorker should implement getter exitedAfterDisconnect.');
  }

  get exitCode() {
    throw new Error('BaseAppWorker should implement getter exitCode.');
  }

  get disableRefork() {
    return this.instance.disableRefork;
  }

  get isDevReload() {
    return this.instance.isDevReload;
  }

  set disableRefork(status) {
    this.instance.disableRefork = status;
  }

  set isDevReload(status) {
    this.instance.isDevReload = status;
  }

  send() {
    throw new Error('BaseAppWorker should implement send.');
  }

  clean() {
    throw new Error('BaseAppWorker should implement clean.');
  }

  static on() {
    throw new Error('BaseAppWorker should implement on.');
  }

  static send() {
    throw new Error('BaseAppWorker should implement send.');
  }

  static kill() {
    throw new Error('BaseAppWorker should implement kill.');
  }

  static gracefulExit() {
    throw new Error('BaseAppWorker should implement gracefulExit.');
  }
}

class BaseAppUtils extends EventEmitter {
  constructor(options, { log, logger, messenger, isProduction }) {
    super();
    this.options = options;
    this.log = log;
    this.logger = logger;
    this.messenger = messenger;
    this.isProduction = isProduction;

    // public attrs
    this.startTime = 0;
    this.startSuccessCount = 0;
    this.isAllWorkerStarted = false;
  }

  getAppWorkerFile() {
    return path.join(__dirname, '../../../app_worker.js');
  }

  fork() {
    throw new Error('BaseApp should implement fork.');
  }

  kill() {
    throw new Error('BaseApp should implement kill.');
  }
}

module.exports = { BaseAppWorker, BaseAppUtils };
