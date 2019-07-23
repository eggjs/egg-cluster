'use strict';

const { worker } = require('cluster');

module.exports = {
  keys: '123',
  cluster: {
    listen: {
      port: worker ? 17010 + worker.id : 17010,
    },
  },
};
