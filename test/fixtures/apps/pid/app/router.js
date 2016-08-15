'use strict';

module.exports = function(app) {
  app.get('/exit', function*() {
    process.exit(1);
  });
};
