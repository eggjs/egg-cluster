'use strict';
console.log('###', process.argv, process.execArgv);

import { EggAppConfig } from 'egg';

export default (appInfo: EggAppConfig) => {
  const config: any = {};
  config.keys = '123456';
  return config;
};
