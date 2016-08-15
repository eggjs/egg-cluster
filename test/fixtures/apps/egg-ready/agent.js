'use strict';

module.exports = function(agent) {
  agent.messenger.on('egg-ready', data => {
    console.log(`agent receive egg-ready, with ${data.workers} workers`);
  });
};
