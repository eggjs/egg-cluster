'use strict';

module.exports = function(app) {
  // 接受来自 parent 的消息
  app.messenger.on('parent2app', msg => console.log(msg));

  // 发送给 parent
  process.send({
    action: 'app2parent',
    data: 'app -> parent',
    to: 'parent',
  });

  // 发送给 app
  app.messenger.sendToAgent('app2agent', 'app -> agent');
  app.messenger.on('agent2app', msg => console.log(msg));

  // 兼容 string
  process.send('agent2appbystring');
};
