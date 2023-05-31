const { sleep } = require('../../../../lib/utils/timer');

module.exports = app => {
  const timeout = process.env.EGG_MASTER_CLOSE_TIMEOUT || 5000;

  app.beforeClose(async () => {
    app.logger.info('app worker start close', Date.now(), timeout);
    await sleep(timeout * 2);
    app.logger.info('app worker never called after timeout');
  });
};
