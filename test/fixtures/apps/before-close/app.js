const { sleep } = require('../../../../lib/utils/timer');

module.exports = app => {
  app.beforeClose(async () => {
    console.log('app closing');
    await sleep(10);
    console.log('app closed');
  });
};
