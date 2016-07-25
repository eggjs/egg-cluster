'use strict';

module.exports = function(agent) {
  // 接受来自 parent 的消息
  agent.messenger.on('parent2agent', msg => console.log(msg));

  // 发送给 parent
  process.send({
    action: 'agent2parent',
    data: 'agent -> parent',
    to: 'parent',
  });

  // 发送给 app，要等 app 启动起来发送
  setTimeout(function() {
    agent.messenger.broadcast('agent2app', 'agent -> app');
  }, 1000);
  agent.messenger.on('app2agent', msg => console.log(msg));
  agent.messenger.on('agent2appbystring', msg => console.log(msg));
};
