'use strict';

import { EggAppConfig } from 'egg';

export default (appInfo: EggAppConfig) => {
  const config: any = {};
  config.keys = '123456';
  return config;
};
