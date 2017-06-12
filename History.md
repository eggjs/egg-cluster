
1.8.0 / 2017-06-12
==================

  * feat: use graceful-process to refactor app and agent worker (#30)
  * test: sleep 20s to wait for agent process start (#29)

1.7.0 / 2017-06-09
==================

  * feat: reduce info logs on local env (#28)

1.6.4 / 2017-05-28
==================

  * fix: agent should exit on disconnect event whatever master kill with SIGKILL (#27)

1.6.3 / 2017-05-22
==================

  * fix: fix typo (#24)
  * fix: start error should log what happend (#26)
  * fix: fix deperated api (#25)
  * deps: upgrade dependencies (#22)

1.6.2 / 2017-03-22
==================

  * fix: should print logger when agent start error (#20)

1.6.1 / 2017-03-03
==================

  * fix: sticky logic error (#19)
  * feat: use egg-utils (#18)

1.6.0 / 2017-03-01
==================

  * feat: add options framework (#17)

1.5.0 / 2017-02-21
==================

  * feat: exit when error emitted during start (#16)

1.4.0 / 2017-02-13
==================

  * feat:add sticky cluster mode (#14)
  * test: add test for agent debug port (#13)

1.3.0 / 2017-01-20
==================

  * feat: get clusterPort (#12)

1.2.0 / 2016-12-26
==================

  * feat: npm publish files limit (#10)

1.1.0 / 2016-12-20
==================

  * deps: upgrade dependencies
  * refactor: options should be passed through
  * feat: print env when start (#8)

1.0.0 / 2016-10-12
==================

  * feat: exit if worker start timeout (#6)

0.2.0 / 2016-10-12
==================

  * feat: when debug mode, master should exit when worker die (#7)
  * test: fix testcase (#5)

0.1.0 / 2016-08-16
==================

  * feat: [BREAKING_CHANGE] master won't load config  (#4)
  * test: add test cases (#3)

0.0.4 / 2016-07-16
==================

  * fix: remove antx loader (#2)

0.0.3 / 2016-07-16
==================

  * fix: loader version (#1)
  * fix: logger

0.0.2 / 2016-07-15
==================

  * init code
