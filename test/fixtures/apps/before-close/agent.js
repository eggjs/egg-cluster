const { sleep } = require('../../../../lib/utils/timer');

module.exports = agent => {
  agent.beforeClose(async () => {
    console.log('agent closing');
    await sleep(10);
    console.log('agent closed');
  });
};
