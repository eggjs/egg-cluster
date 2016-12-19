'use strict';

const fs = require('fs');
const debug = require('debug')('egg-cluster');
const consoleLogger = require('./utils/console');

// $ node app_worker.js options
const options = JSON.parse(process.argv[2]);

const Application = require(options.customEgg).Application;
debug('new Application with options %j', options);
const app = new Application(options);
app.ready(startServer);

// exit if worker start timeout
app.once('startTimeout', startTimeoutHanlder);
function startTimeoutHanlder() {
  consoleLogger.error('[app_worker] App Worker start timeout, exiting now!');
  process.exit(1);
}

function startServer() {
  app.removeListener('startTimeout', startTimeoutHanlder);
  let server;
  if (options.https) {
    server = require('https').createServer({
      key: fs.readFileSync(options.key),
      cert: fs.readFileSync(options.cert),
    }, app.callback());
  } else {
    server = require('http').createServer(app.callback());
  }

  // emit `server` event in app
  app.emit('server', server);

  server.listen(options.port);
}

// exit gracefully
process.once('SIGTERM', () => {
  consoleLogger.warn('[app_worker] App Worker exit with signal SIGTERM');
  process.exit(0);
});
