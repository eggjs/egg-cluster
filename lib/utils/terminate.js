'use strict';

const sleep = require('mz-modules/sleep');
const awaitEvent = require('await-event');
const pstree = require('ps-tree');

module.exports = function* (process, timeout) {
  const pid = process.process ? process.process.pid : process.pid;
  const children = yield getChildren(pid);
  yield [
    killProcess(process, timeout),
    killChildren(children, timeout),
  ];
};

// kill process, if SIGTERM not work, try SIGKILL
function* killProcess(subProcess, timeout) {
  subProcess.kill('SIGTERM');
  yield Promise.race([
    awaitEvent(subProcess, 'exit'),
    sleep(timeout),
  ]);
  if (subProcess.killed) {
    return;
  }
  // SIGKILL: http://man7.org/linux/man-pages/man7/signal.7.html
  // worker: https://github.com/nodejs/node/blob/master/lib/internal/cluster/worker.js#L22
  // subProcess.kill is wrapped to subProcess.destroy, it will wait to disconnected.
  (subProcess.process || subProcess).kill('SIGKILL');
}

// kill all children processes, if SIGTERM not work, try SIGKILL
function* killChildren(children, timeout) {
  if (!children.length) return;
  kill(children, 'SIGTERM');

  const start = Date.now();
  const checkInterval = 400;
  let unterminated = [];

  while (Date.now() - start < timeout - checkInterval) {
    yield sleep(checkInterval);
    unterminated = getUnterminatedProcesses(children);
    if (!unterminated.length) return;
  }
  kill(unterminated, 'SIGKILL');
}

function getChildren(pid) {
  return new Promise(resolve => {
    pstree(pid, (err, children) => {
      // if get children error, just ignore it
      if (err) children = [];
      resolve(children.map(children => parseInt(children.PID)));
    });
  });
}

function kill(pids, signal) {
  for (const pid of pids) {
    try {
      process.kill(pid, signal);
    } catch (_) {
      // ignore
    }
  }
}

function getUnterminatedProcesses(pids) {
  return pids.filter(pid => {
    try {
      // success means it's still alive
      process.kill(pid, 0);
      return true;
    } catch (err) {
      // error means it's dead
      return false;
    }
  });
}

