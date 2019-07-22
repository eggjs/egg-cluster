'use strict';

module.exports = app => {
  app.get('/', function* () {
    this.body = 'https server config';
  });
};
