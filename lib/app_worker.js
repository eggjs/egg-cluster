'use strict';

const fs = require('fs');
const consoleLogger = require('./utils/console');

// $ node app_worker.js options
const options = JSON.parse(process.argv[2]);

const Application = require(options.customEgg).Application;
const app = new Application({
  customEgg: options.customEgg,
  baseDir: options.baseDir,
  plugins: options.plugins,
});
app.ready(startServer);

function startServer() {
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
