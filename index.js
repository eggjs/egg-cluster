'use strict';

const Master = require('./lib/master');

/**
 * cluster start flow:
 *
 * [startCluster] -> master -> agent_worker -> new [Agent]       -> agentWorkerLoader
 *                         `-> app_worker   -> new [Application] -> appWorkerLoader
 *
 */

/**
 * start egg app
 * @method Egg#startCluster
 * @param {Object} options {@link Master}
 * @param {Function} callback start success callback
 * @return {Object} - master
 */
exports.startCluster = function(options, callback) {
  const master = new Master(options);
  master.ready(callback);
  return master;
};
