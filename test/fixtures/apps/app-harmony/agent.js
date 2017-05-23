'use strict';

module.exports = () => {
  console.log(process.execArgv.includes('--harmony') ? 'agent with harmony' : 'agent without harmony');
};
