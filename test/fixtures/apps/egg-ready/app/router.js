'use strict';

module.exports = app => {
  app.get('/exception-app', function* () {
    setTimeout(() => {
      throw new Error('error');
    }, 1);
    this.body = 'done';
  });

  app.get('/exception-agent', function* () {
    app.messenger.sendToAgent('throw');
    this.body = 'done';
  });
};
