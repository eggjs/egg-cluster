'use strict';

/**
 * agent worker is child_process forked by master.
 *
 * agent worker only exit in two cases:
 *  - receive signal SIGTERM, exit code 0 (exit gracefully)
 *  - receive disconnect event, exit code 110 (maybe master exit in accident)
 */

const debug = require('debug')('egg-cluster');
const consoleLogger = require('./utils/console');

// $ node agent_worker.js options
const options = JSON.parse(process.argv[2]);

const Agent = require(options.framework).Agent;
debug('new Agent with options %j', options);
const agent = new Agent(options);

function startErrorHandler(err) {
  consoleLogger.error(err);
  consoleLogger.error('[agent_worker] start error, exiting with code:1');
  process.exit(1);
}

agent.ready(() => {
  agent.removeListener('error', startErrorHandler);
  process.send({ action: 'agent-start', to: 'master' });
});

// exit if agent start error
agent.once('error', startErrorHandler);

// exit gracefully
process.once('SIGTERM', () => {
  consoleLogger.info('[agent_worker] receive signal SIGTERM, exiting with code:0');
  process.exit(0);
});

process.once('disconnect', () => {
  // wait a loop for SIGTERM event happen
  setImmediate(() => {
    // agent won't reload on normal case
    // if disconnect event emit, maybe master exit in accident
    consoleLogger.error('[agent_worker] receive disconnect event on child_process fork mode, exiting with code:110');
    process.exit(110);
  });
});

process.once('exit', code => {
  const level = code === 0 ? 'info' : 'error';
  consoleLogger[level]('[agent_worker] exit with code:%s', code);
});
