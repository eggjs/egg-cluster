'use strict';

module.exports = function() {
  process.on('message', msg => {
    if (msg.action === 'kill-agent') process.exit(1);
  });
};
