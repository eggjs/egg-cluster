'use strict';

module.exports = function(app) {
  process.send({
    action: 'kill-agent',
  });
  setTimeout(app.readyCallback(), 2000);
};
