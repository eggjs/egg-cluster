'use strict';

const childprocess = require('child_process');
const semver = require('semver');
const sendmessage = require('sendmessage');
const gracefulExit = require('graceful-process');

const { BaseAgentWorker, BaseAgentUtils } = require('../../base/agent');
const terminate = require('../../../terminate');

class AgentWorker extends BaseAgentWorker {
  get workerId() {
    return this.instance.pid;
  }

  send(...args) {
    sendmessage(this.instance, ...args);
  }

  static send(data) {
    process.send(data);
  }

  static kill() {
    process.exitCode = 1;
    process.kill(process.pid);
  }

  static gracefulExit(options) {
    gracefulExit(options);
  }
}

class AgentUtils extends BaseAgentUtils {
  #worker = null;
  #id = 0;

  fork() {
    this.startTime = Date.now();

    const args = [ JSON.stringify(this.options) ];
    const opt = {};

    if (process.platform === 'win32') opt.windowsHide = true;

    // add debug execArgv
    const debugPort = process.env.EGG_AGENT_DEBUG_PORT || 5800;
    if (this.options.isDebug) opt.execArgv = process.execArgv.concat([ `--${semver.gte(process.version, '8.0.0') ? 'inspect' : 'debug'}-port=${debugPort}` ]);

    const worker = this.#worker = childprocess.fork(this.getAgentWorkerFile(), args, opt);
    const agentWorker = this.instance = new AgentWorker(worker);
    this.emit('agent_forked', agentWorker);
    agentWorker.status = 'starting';
    agentWorker.id = ++this.#id;
    this.log('[master] agent_worker#%s:%s start with clusterPort:%s',
      agentWorker.id, agentWorker.workerId, this.options.clusterPort);

    // send debug message
    if (this.options.isDebug) {
      this.messenger.send({
        to: 'parent',
        from: 'agent',
        action: 'debug',
        data: {
          debugPort,
          pid: agentWorker.workerId,
        },
      });
    }
    // forwarding agent' message to messenger
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

    return this;
  }

  clean() {
    this.#worker.removeAllListeners();
  }

  async kill(timeout) {
    const worker = this.#worker;
    if (worker) {
      this.log('[master] kill agent worker with signal SIGTERM');
      this.clean();
      await terminate(worker, timeout);
    }
  }
}

module.exports = { AgentWorker, AgentUtils };
