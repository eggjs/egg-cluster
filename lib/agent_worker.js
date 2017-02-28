'use strict';

/**
 * agent worker is forked by master
 */

const debug = require('debug')('egg-cluster');
const consoleLogger = require('./utils/console');

// $ node agent_worker.js options
const options = JSON.parse(process.argv[2]);

const Agent = require(options.framework).Agent;
debug('new Agent with options %j', options);
const agent = new Agent(options);

agent.ready(() => {
  agent.removeListener('error', startErrorHanddler);
  process.send({ action: 'agent-start', to: 'master' });
});

// exit if agent start error
agent.once('error', startErrorHanddler);
function startErrorHanddler() {
  consoleLogger.error('[agent_worker] Agent Worker start error, exiting now!');
  process.exit(1);
}

// exit gracefully
process.once('SIGTERM', () => {
  consoleLogger.warn('[agent_worker] Agent Worker exit with signal SIGTERM');
  process.exit(0);
});
