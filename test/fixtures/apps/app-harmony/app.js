'use strict';

module.exports = () => {
  console.log(process.execArgv.includes('--harmony') ? 'app with harmony' : 'app without harmony');
};
