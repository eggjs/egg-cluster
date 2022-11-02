'use strict';

const EventEmitter = require('events');

// worker manager to record agent and worker forked by egg-cluster
// can do some check stuff here to monitor the healthy
class Manager extends EventEmitter {
  constructor() {
    super();
    this.workers = new Map();
    this.agent = null;
  }

  getWorkers() {
    return Array.from(this.workers.keys());
  }

  setAgent(agent) {
    this.agent = agent;
  }

  getAgent() {
    return this.agent;
  }

  deleteAgent() {
    this.agent = null;
  }

  setWorker(worker) {
    this.workers.set(worker.workerId, worker);
  }

  getWorker(workerId) {
    return this.workers.get(workerId);
  }

  deleteWorker(workerId) {
    this.workers.delete(workerId);
  }

  listWorkerIds() {
    return Array.from(this.workers.keys());
  }

  getListeningWorkerIds() {
    const keys = [];
    for (const id of this.workers.keys()) {
      if (this.getWorker(id).state === 'listening') {
        keys.push(id);
      }
    }
    return keys;
  }

  count() {
    return {
      agent: (this.agent && this.agent.status === 'started') ? 1 : 0,
      worker: this.listWorkerIds().length,
    };
  }

  // check agent and worker must both alive
  // if exception appear 3 times, emit an exception event
  startCheck() {
    this.exception = 0;
    this.timer = setInterval(() => {
      const count = this.count();
      if (count.agent && count.worker) {
        this.exception = 0;
        return;
      }
      this.exception++;
      if (this.exception >= 3) {
        this.emit('exception', count);
        clearInterval(this.timer);
      }
    }, 10000);
  }
}

module.exports = Manager;
