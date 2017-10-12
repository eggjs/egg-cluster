'use strict';

module.exports = function(app) {
  app.get('/exit', function* () {
    setTimeout(() => {
      throw new Error('exit');
    }, 10);
    this.body = 'exit';
  });
};
