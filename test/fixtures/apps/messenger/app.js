'use strict';

module.exports = function(app) {
  // from parent
  app.messenger.on('parent2app', msg => console.log(msg));

  // send to parent
  process.send({
    action: 'app2parent',
    data: 'app -> parent',
    to: 'parent',
  });

  // send to app
  app.messenger.sendToAgent('app2agent', 'app -> agent');
  app.messenger.on('agent2app', msg => console.log(msg));

  // compatible with string
  process.send('app2agentbystring');
  app.messenger.on('agent2appbystring', msg => console.log('app: ' + msg));
};
