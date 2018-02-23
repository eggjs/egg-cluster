'use strict';

process.on('message', function(msg) {
  if (msg.action === 'kill') process.exit(1);
});
