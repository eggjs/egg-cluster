'use strict';

module.exports = function(app) {
  app.get('/kill', function*() {
    const signal = this.query.signal && this.query.signal.toUpperCase();
    this.logger.info('kill by signal', signal, process.execArgv);
    process.kill(process.pid, signal);
  });
};
