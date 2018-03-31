'use strict';

const mm = require('egg-mock');
const utils = require('./utils');

describe.only('test/ts.test.js', () => {
  if (process.env.EGG_VERSION && process.env.EGG_VERSION === '1') {
    console.log('skip egg@1');
    return;
  }

  let app;

  afterEach(mm.restore);
  afterEach(() => app.close());

  it('support typescript', done => {
    mm.env('local');
    app = utils.cluster('apps/ts', {
      typescript: true,
      opt: { execArgv: [ '--require', require.resolve('ts-node/register') ] },
    });
    app.debug();
    app.expect('stdout', /hi, egg, 123456/)
      .expect('stdout', /egg started/)
      .notExpect('stdout', /\[master\] agent_worker#1:\d+ start with clusterPort:\d+/)
      .expect('code', 0)
      .end(done);
  });

  it('require ts-node register', done => {
    mm.env('local');
    app = utils.cluster('apps/ts', {
      typescript: true,
    });
    // app.debug();
    app.expect('stderr', /`require.extensions` should contains `.ts`/)
      .expect('code', 1)
      .end(done);
  });
});
