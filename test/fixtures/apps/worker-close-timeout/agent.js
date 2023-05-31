const { sleep } = require('../../../../lib/utils/timer');

module.exports = app => {
  const timeout = process.env.EGG_MASTER_CLOSE_TIMEOUT || 5000;

  app.beforeClose(async () => {
    app.logger.info('agent worker start close: ' + Date.now());
    await sleep(timeout * 2);
    app.logger.info('agent worker: never called after timeout');
  });
};
