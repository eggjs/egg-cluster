/* istanbul ignore file */
'use strict';

const path = require('path');
const EventEmitter = require('events').EventEmitter;

class BaseAgentWorker {
  constructor(instance) {
    this.instance = instance;
  }

  get workerId() {
    throw new Error('BaseAgentWorker should implement getter workerId.');
  }

  get id() {
    return this.instance.id;
  }

  get status() {
    return this.instance.status;
  }

  set id(id) {
    this.instance.id = id;
  }

  set status(status) {
    this.instance.status = status;
  }

  send() {
    throw new Error('BaseAgentWorker should implement send.');
  }

  static send() {
    throw new Error('BaseAgentWorker should implement send.');
  }

  static kill() {
    throw new Error('BaseAgentWorker should implement kill.');
  }

  static gracefulExit() {
    throw new Error('BaseAgentWorker should implement gracefulExit.');
  }
}

class BaseAgentUtils extends EventEmitter {
  constructor(options, { log, logger, messenger }) {
    super();
    this.options = options;
    this.log = log;
    this.logger = logger;
    this.messenger = messenger;

    // public attrs
    this.startTime = 0;
    this.instance = null;
  }

  getAgentWorkerFile() {
    return path.join(__dirname, '../../../agent_worker.js');
  }

  fork() {
    throw new Error('BaseAgent should implement fork.');
  }

  clean() {
    throw new Error('BaseAgent should implement clean.');
  }

  kill() {
    throw new Error('BaseAgent should implement kill.');
  }
}

module.exports = { BaseAgentWorker, BaseAgentUtils };
