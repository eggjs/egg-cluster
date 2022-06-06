'use strict';

const sleep = require('mz-modules/sleep');
const utils = require('../../../utils');

(async function() {
  const app = utils.cluster('apps/agent-exit');
  app.debug();
  await app.end();

  app.proc.on('message', () => {
    process.send(app.proc.pid, () => {
      // close child process IPC
      // node v6 process._channel
      // node v8 process.channel
      const channel = app.proc._channel || app.proc.channel;
      console.error(channel);
      channel.close && channel.close();
    });
  });

  await sleep(3000);
})();
