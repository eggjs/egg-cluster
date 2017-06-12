'use strict';

const fs = require('fs');
const debug = require('debug')('egg-cluster');
const gracefulExit = require('graceful-process');
const consoleLogger = require('./utils/console');

// $ node app_worker.js options
const options = JSON.parse(process.argv[2]);

const Application = require(options.framework).Application;
debug('new Application with options %j', options);
const app = new Application(options);
app.ready(startServer);

// exit if worker start error

app.once('error', startErrorHandler);
function startErrorHandler(err) {
  consoleLogger.error(err);
  consoleLogger.error('[app_worker] start error, exiting with code:1');
  process.exit(1);
}

// exit if worker start timeout
app.once('startTimeout', startTimeoutHandler);
function startTimeoutHandler() {
  consoleLogger.error('[app_worker] start timeout, exiting with code:1');
  process.exit(1);
}

function startServer() {
  app.removeListener('error', startErrorHandler);
  app.removeListener('startTimeout', startTimeoutHandler);

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

gracefulExit({
  logger: consoleLogger,
  label: 'app_worker',
});
