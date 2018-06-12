'use strict';

module.exports = () => {
  process.on('message', function(msg) {
    if (msg.action === 'debug') {
      console.log(msg.debugPort);
    }
  });
};
