'use strict';

module.exports = app => {
  app.get('/', function* () {
    this.body = 'done';
  });

  app.get('/port', function* () {
    this.body = this.app._options.port;
  });
};
