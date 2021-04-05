'use strict';

const co = require('co');
const sleep = require('mz-modules/sleep');
const utils = require('../../../utils');

co(function* () {
  const app = utils.cluster('apps/agent-exit');
  app.debug();
  yield app.end();

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

  yield sleep(3000);
});
