'use strict';

module.exports = function(agent) {
  // from parent
  agent.messenger.on('parent2agent', msg => console.log(msg));

  // send to parent
  process.send({
    action: 'agent2parent',
    data: 'agent -> parent',
    to: 'parent',
  });

  // send to app after they started
  agent.messenger.on('egg-ready', () => {
    agent.messenger.sendToApp('agent2app', 'agent -> app');
    // compatible with string
    process.send('agent2appbystring');
  });
  agent.messenger.on('app2agent', msg => console.log(msg));

  // compatible with string
  agent.messenger.on('app2agentbystring', msg => console.log('agent: ' + msg));
};
