'use strict';

module.exports = function(app) {
  app.get('/exit', function* () {
    console.log(1111);
    setTimeout(() => {
      throw new Error('exit');
    }, 10);
    this.body = 'exit';
  });
};
