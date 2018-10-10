'use strict';

console.log('worker2 [%s] started', process.pid);

setTimeout(() => {
  console.log('worker2 alived');
}, 4000);

setTimeout(() => {
  console.log('worker2 still alived');
}, 8000);

process.on('SIGTERM', () => {
  console.log('worker2 on sigterm and exit');
  process.exit(0);
});