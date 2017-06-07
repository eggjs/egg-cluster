'use strict';

const os = require('os');
const util = require('util');
const path = require('path');
const cluster = require('cluster');
const EventEmitter = require('events');
const childprocess = require('child_process');
const cfork = require('cfork');
const ready = require('get-ready');
const detectPort = require('detect-port');
const ConsoleLogger = require('egg-logger').EggConsoleLogger;

const parseOptions = require('./utils/options');
const Messenger = require('./utils/messenger');

const agentWorkerFile = path.join(__dirname, 'agent_worker.js');
const appWorkerFile = path.join(__dirname, 'app_worker.js');

class Master extends EventEmitter {

  /**
   * @constructor
   * @param {Object} options
   *  - {String} [framework] - specify framework that can be absolute path or npm package
   *  - {String} [baseDir] directory of application, default to `process.cwd()`
   *  - {Object} [plugins] - customized plugins, for unittest
   *  - {Number} [workers] numbers of app workers, default to `os.cpus().length`
   *  - {Number} [port] listening port, default to 7001(http) or 8443(https)
   *  - {Boolean} [https] https or not
   *  - {String} [key] ssl key
   *  - {String} [cert] ssl cert
   */
  constructor(options) {
    super();
    this.options = parseOptions(options);
    this.messenger = new Messenger(this);

    ready.mixin(this);

    this.isProduction = isProduction();
    this.isDebug = isDebug();
    this.agentWorkerIndex = 0;
    this.agentWorker = null;
    this.closed = false;

    // app started or not
    this.isStarted = false;
    this.logger = new ConsoleLogger({ level: process.env.EGG_MASTER_LOGGER_LEVEL || 'INFO' });
    this.logMethod = 'info';
    if (process.env.EGG_SERVER_ENV === 'local' || process.env.NODE_ENV === 'development') {
      this.logMethod = 'debug';
    }

    this.log = function log(...args) {
      this.logger[this.logMethod](...args);
    };

    // get the real framework info
    const frameworkPath = this.options.framework;
    const frameworkPkg = require(path.join(frameworkPath, 'package.json'));

    this.log(`[master] =================== ${frameworkPkg.name} start =====================`);
    this.logger.info(`[master] ${frameworkPkg.name} version ${frameworkPkg.version}`);
    if (this.isProduction) {
      this.logger.info('[master] start with options:%s%s',
        os.EOL, JSON.stringify(this.options, null, 2));
    } else {
      this.log('[master] start with options: %j', this.options);
    }
    this.log('[master] start with env: isProduction: %s, isDebug: %s, EGG_SERVER_ENV: %s, NODE_ENV: %s',
      this.isProduction, this.isDebug, process.env.EGG_SERVER_ENV, process.env.NODE_ENV);


    const startTime = Date.now();

    this.ready(() => {
      this.isStarted = true;
      const stickyMsg = this.options.sticky ? ' with STICKY MODE!' : '';
      this.logger.info('[master] %s started on %s://127.0.0.1:%s (%sms)%s',
        frameworkPkg.name, this.options.https ? 'https' : 'http',
        this.options.port, Date.now() - startTime, stickyMsg);

      const action = 'egg-ready';
      this.messenger.send({ action, to: 'parent' });
      this.messenger.send({ action, to: 'app', data: this.options });
      this.messenger.send({ action, to: 'agent', data: this.options });
    });

    this.on('agent-exit', this.onAgentExit.bind(this));
    this.on('agent-start', this.onAgentStart.bind(this));
    this.on('app-exit', this.onAppExit.bind(this));
    this.on('app-start', this.onAppStart.bind(this));
    this.on('reload-worker', this.onReload.bind(this));

    // fork app workers after agent started
    this.once('agent-start', this.forkAppWorkers.bind(this));

    // https://nodejs.org/api/process.html#process_signal_events
    // https://en.wikipedia.org/wiki/Unix_signal
    // kill(2) Ctrl-C
    process.once('SIGINT', this.onSignal.bind(this, 'SIGINT'));
    // kill(3) Ctrl-\
    process.once('SIGQUIT', this.onSignal.bind(this, 'SIGQUIT'));
    // kill(15) default
    process.once('SIGTERM', this.onSignal.bind(this, 'SIGTERM'));

    process.once('exit', this.onExit.bind(this));

    detectPort((err, port) => {
      /* istanbul ignore if */
      if (err) {
        err.name = 'ClusterPortConflictError';
        err.message = '[master] try get free port error, ' + err.message;
        this.logger.error(err);
        process.exit(1);
        return;
      }
      this.options.clusterPort = port;
      this.forkAgentWorker();
    });
  }

  startMasterSocketServer(cb) {
    // Create the outside facing server listening on our port.
    require('net').createServer({ pauseOnConnect: true }, connection => {
      // We received a connection and need to pass it to the appropriate
      // worker. Get the worker for this connection's source IP and pass
      // it the connection.
      const worker = this.stickyWorker(connection.remoteAddress);
      worker.send('sticky-session:connection', connection);
    }).listen(this.options.port, cb);
  }

  stickyWorker(ip) {
    const workerNumbers = this.options.workers;
    const ws = Array.from(this.workers.keys());

    let s = '';
    for (let i = 0; i < ip.length; i++) {
      if (!isNaN(ip[i])) {
        s += ip[i];
      }
    }
    s = Number(s);
    const pid = ws[s % workerNumbers];
    return this.workers.get(pid);
  }

  forkAgentWorker() {
    this.agentStartTime = Date.now();

    const args = [ JSON.stringify(this.options) ];
    // worker name     | debug port
    // ---             | ---
    // agent_worker#0  | 5856
    // master          | 5857
    // app_worker#0    | 5858
    // app_worker#1    | 5859
    // ...
    const opt = { execArgv: process.execArgv.concat([ '--debug-port=5856' ]) };
    const agentWorker = this.agentWorker = childprocess.fork(agentWorkerFile, args, opt);
    agentWorker.id = ++this.agentWorkerIndex;
    this.log('[master] agent_worker#%s:%s start with clusterPort:%s',
      agentWorker.id, agentWorker.pid, this.options.clusterPort);

    // forwarding agent' message to messenger
    agentWorker.on('message', msg => {
      if (typeof msg === 'string') msg = { action: msg, data: msg };
      msg.from = 'agent';
      this.messenger.send(msg);
    });
    agentWorker.on('error', err => {
      err.name = 'AgentWorkerError';
      err.id = agentWorker.id;
      err.pid = agentWorker.pid;
      this.logger.error(err);
    });
    // agent exit message
    agentWorker.once('exit', (code, signal) => {
      this.messenger.send({
        action: 'agent-exit',
        data: { code, signal },
        to: 'master',
        from: 'agent',
      });
    });
  }

  forkAppWorkers() {
    this.appStartTime = Date.now();
    this.isAllAppWorkerStarted = false;
    this.startSuccessCount = 0;

    this.workers = new Map();

    const args = [ JSON.stringify(this.options) ];
    this.log('[master] start appWorker with args %j', args);
    cfork({
      exec: appWorkerFile,
      args,
      silent: false,
      count: this.options.workers,
      // don't refork in local env
      refork: this.isProduction,
    });

    cluster.on('fork', worker => {
      this.workers.set(worker.process.pid, worker);
      worker.on('message', msg => {
        if (typeof msg === 'string') msg = { action: msg, data: msg };
        msg.from = 'app';
        this.messenger.send(msg);
      });
      this.log('[master] app_worker#%s:%s start, state: %s, current workers: %j',
        worker.id, worker.process.pid, worker.state, Object.keys(cluster.workers));
    });
    cluster.on('disconnect', worker => {
      this.logger.info('[master] app_worker#%s:%s disconnect, suicide: %s, state: %s, current workers: %j',
        worker.id, worker.process.pid, worker.exitedAfterDisconnect, worker.state, Object.keys(cluster.workers));
    });
    cluster.on('exit', (worker, code, signal) => {
      this.messenger.send({
        action: 'app-exit',
        data: { workerPid: worker.process.pid, code, signal },
        to: 'master',
        from: 'app',
      });
    });
    cluster.on('listening', (worker, address) => {
      this.messenger.send({
        action: 'app-start',
        data: { workerPid: worker.process.pid, address },
        to: 'master',
        from: 'app',
      });
    });
  }

  /**
   * close agent worker, App Worker will closed by cluster
   *
   * https://www.exratione.com/2013/05/die-child-process-die/
   * make sure Agent Worker exit before master exit
   */
  killAgentWorker() {
    if (this.agentWorker) {
      this.log('[master] kill agent worker with signal SIGTERM');
      this.agentWorker.removeAllListeners();
      this.agentWorker.kill('SIGTERM');
    }
  }

  killAppWorkers() {
    for (const id in cluster.workers) {
      cluster.workers[id].process.kill('SIGTERM');
    }
  }

  /**
   * Agent Worker exit handler
   * Will exit during startup, and refork during running.
   * @param {Object} data
   *  - {Number} code - exit code
   *  - {String} signal - received signal
   */
  onAgentExit(data) {
    if (this.closed) return;

    this.messenger.send({ action: 'egg-pids', to: 'app', data: [] });
    const agentWorker = this.agentWorker;
    this.agentWorker = null;

    const err = new Error(util.format('[master] agent_worker#%s:%s died (code: %s, signal: %s)',
      agentWorker.id, agentWorker.pid, data.code, data.signal));
    err.name = 'AgentWorkerDiedError';
    this.logger.error(err);

    // remove all listeners to avoid memory leak
    agentWorker.removeAllListeners();

    if (this.isStarted) {
      this.log('[master] try to start a new agent_worker after 1s ...');
      setTimeout(() => {
        this.logger.info('[master] new agent_worker starting...');
        this.forkAgentWorker();
      }, 1000);
      this.messenger.send({
        action: 'agent-worker-died',
        to: 'parent',
      });
    } else {
      this.logger.error('[master] agent_worker#%s:%s start fail, exiting with code:1',
        agentWorker.id, agentWorker.pid);
      process.exit(1);
    }
  }

  onAgentStart() {
    this.messenger.send({ action: 'egg-pids', to: 'app', data: [ this.agentWorker.pid ] });
    this.messenger.send({ action: 'agent-start', to: 'app' });
    this.logger.info('[master] agent_worker#%s:%s started (%sms)',
      this.agentWorker.id, this.agentWorker.pid, Date.now() - this.agentStartTime);
  }

  /**
   * App Worker exit handler
   * @param {Object} data
   *  - {String} workerPid - worker id
   *  - {Number} code - exit code
   *  - {String} signal - received signal
   */
  onAppExit(data) {
    if (this.closed) return;

    const worker = this.workers.get(data.workerPid);

    if (!worker.isDevReload) {
      const signal = data.code;
      const message = util.format(
        '[master] app_worker#%s:%s died (code: %s, signal: %s, suicide: %s, state: %s), current workers: %j',
        worker.id, worker.process.pid, worker.process.exitCode, signal,
        worker.exitedAfterDisconnect, worker.state,
        Object.keys(cluster.workers)
      );
      const err = new Error(message);
      err.name = 'AppWorkerDiedError';
      this.logger.error(err);
    }

    // remove all listeners to avoid memory leak
    worker.removeAllListeners();
    this.workers.delete(data.workerPid);
    // send message to agent with alive workers
    this.messenger.send({ action: 'egg-pids', to: 'agent', data: getListeningWorker(this.workers) });

    if (this.isAllAppWorkerStarted) {
      // cfork will only refork at production mode
      this.messenger.send({
        action: 'app-worker-died',
        to: 'parent',
      });

      if (this.isDebug && !worker.isDevReload) {
        // exit if died during debug
        this.logger.error('[master] kill by debugger, exiting with code:0');
        process.exit(0);
      }
    } else {
      // exit if died during startup
      this.logger.error('[master] app_worker#%s:%s start fail, exiting with code:1',
        worker.id, worker.process.pid);
      process.exit(1);
    }
  }

  /**
   * after app worker
   * @param {Object} data
   *  - {String} workerPid - worker id
   *  - {Object} address - server address
   */
  onAppStart(data) {
    const worker = this.workers.get(data.workerPid);
    const address = data.address;

    // ignore unspecified port
    if (!this.options.sticky && (String(address.port) !== String(this.options.port))) {
      return;
    }

    // send message to agent with alive workers
    this.messenger.send({
      action: 'egg-pids',
      to: 'agent',
      data: getListeningWorker(this.workers),
    });

    this.startSuccessCount++;

    const remain = this.isAllAppWorkerStarted ? 0 : this.options.workers - this.startSuccessCount;
    this.log('[master] app_worker#%s:%s started at %s, remain %s (%sms)',
      worker.id, data.workerPid, address.port, remain, Date.now() - this.appStartTime);

    if (this.isAllAppWorkerStarted || this.startSuccessCount < this.options.workers) {
      return;
    }

    this.isAllAppWorkerStarted = true;

    if (this.options.sticky) {
      this.startMasterSocketServer(err => {
        if (err) return this.ready(err);
        this.ready(true);
      });
    } else {
      this.ready(true);
    }
  }

  /**
   * master exit handler
   */

  onExit(code) {
    // istanbul can't cover here
    // https://github.com/gotwarlost/istanbul/issues/567
    const level = code === 0 ? 'info' : 'error';
    this.logger[level]('[master] exit with code:%s', code);
  }

  onSignal(signal) {
    if (this.closed) return;

    this.logger.info('[master] receive signal %s, closing', signal);
    this.close();
  }

  /**
   * reload workers, for develop purpose
   */
  onReload() {
    this.log('[master] reload workers...');
    for (const id in cluster.workers) {
      const worker = cluster.workers[id];
      worker.isDevReload = true;
    }
    require('cluster-reload')(this.options.workers);
  }

  close() {
    this.closed = true;
    // kill app workers
    // kill agent worker
    // exit itself
    this.killAppWorkers();
    this.killAgentWorker();
    this.log('[master] close done, exiting with code:0');
    process.exit(0);
  }
}

module.exports = Master;

function getListeningWorker(workers) {
  const keys = [];
  for (const id of workers.keys()) {
    if (workers.get(id).state === 'listening') {
      keys.push(id);
    }
  }
  return keys;
}

function isProduction() {
  const serverEnv = process.env.EGG_SERVER_ENV;
  if (serverEnv) {
    return serverEnv !== 'local' && serverEnv !== 'unittest';
  }
  return process.env.NODE_ENV === 'production';
}

function isDebug() {
  return process.execArgv.indexOf('--debug') !== -1 || typeof v8debug !== 'undefined';
}
