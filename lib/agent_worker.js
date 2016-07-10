'use strict';

/**
 * agent worker is forked by master
 */

const consoleLogger = require('./utils/console');

// $ node agent_worker.js options
const options = JSON.parse(process.argv[2]);

const Agent = require(options.customEgg).Agent;
const agent = new Agent({
  baseDir: options.baseDir,
  plugins: options.plugins,
  customEgg: options.customEgg,
});
agent.ready(() => process.send({ action: 'agent-start', to: 'master' }));

// exit gracefully
process.once('SIGTERM', () => {
  consoleLogger.warn('[agent_worker] Agent Worker exit with signal SIGTERM');
  process.exit(0);
});
