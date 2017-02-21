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

// exit if worker start error
app.once('error', startErrorHanddler);
function startErrorHanddler() {
  consoleLogger.error('[app_worker] App Worker start error, exiting now!');
  process.exit(1);
}

// exit if worker start timeout
app.once('startTimeout', startTimeoutHanlder);
function startTimeoutHanlder() {
  consoleLogger.error('[app_worker] App Worker start timeout, exiting now!');
  process.exit(1);
}

function startServer() {
  app.removeListener('error', startErrorHanddler);
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

  if (options.sticky) {
    server.listen(0, '127.0.0.1');
    // Listen to messages sent from the master. Ignore everything else.
    process.on('message', (message, connection) => {
      if (message !== 'sticky-session:connection') {
        return;
      }

      // Emulate a connection event on the server by emitting the
      // event with the connection the master sent us.
      server.emit('connection', connection);
      connection.resume();
    });
  } else {
    server.listen(options.port);
  }
}

// exit gracefully
process.once('SIGTERM', () => {
  consoleLogger.warn('[app_worker] App Worker exit with signal SIGTERM');
  process.exit(0);
});
