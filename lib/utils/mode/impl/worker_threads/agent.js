'use strict';

const workerThreads = require('worker_threads');
const { BaseAgentUtils, BaseAgentWorker } = require('../../base/agent');

class AgentWorker extends BaseAgentWorker {
  get workerId() {
    return this.instance.threadId;
  }

  send(...args) {
    this.instance.postMessage(...args);
  }

  static send(data) {
    workerThreads.parentPort.postMessage(data);
  }

  static kill() {
    // in worker_threads, process.exit
    // does not stop the whole program, just the single thread
    process.exit(1);
  }

  static gracefulExit(options) {
    const { beforeExit } = options;
    process.on('exit', async code => {
      if (typeof beforeExit === 'function') {
        await beforeExit();
      }
      process.exit(code);
    });
  }
}

class AgentUtils extends BaseAgentUtils {
  #worker = null;
  #id = 0;

  fork() {
    this.startTime = Date.now();

    // start agent worker
    const argv = [ JSON.stringify(this.options) ];
    const agentPath = this.getAgentWorkerFile();
    const worker = this.#worker = new workerThreads.Worker(agentPath, { argv });

    // wrap agent worker
    const agentWorker = this.instance = new AgentWorker(worker);
    this.emit('agent_forked', agentWorker);
    agentWorker.status = 'starting';
    agentWorker.id = ++this.#id;
    this.log('[master] agent_worker#%s:%s start with worker_threads',
      agentWorker.id, agentWorker.workerId);

    worker.on('message', msg => {
      if (typeof msg === 'string') {
        msg = {
          action: msg,
          data: msg,
        };
      }
      msg.from = 'agent';
      this.messenger.send(msg);
    });

    worker.on('error', err => {
      err.name = 'AgentWorkerError';
      err.id = worker.id;
      err.pid = agentWorker.workerId;
      this.logger.error(err);
    });

    // agent exit message
    worker.once('exit', (code, signal) => {
      this.messenger.send({
        action: 'agent-exit',
        data: {
          code,
          signal,
        },
        to: 'master',
        from: 'agent',
      });
    });
  }

  clean() {
    this.#worker.removeAllListeners();
  }

  async kill() {
    const worker = this.#worker;
    if (worker) {
      this.log(`[master] kill agent worker#${this.#id} (worker_threads) by worker.terminate()`);
      this.clean();
      worker.terminate();
    }
  }
}

module.exports = { AgentWorker, AgentUtils };
