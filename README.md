# egg-cluster

[![NPM version][npm-image]][npm-url]
[![CI](https://github.com/eggjs/egg-cluster/actions/workflows/nodejs.yml/badge.svg)](https://github.com/eggjs/egg-cluster/actions/workflows/nodejs.yml)
[![Test coverage][codecov-image]][codecov-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/egg-cluster.svg?style=flat-square
[npm-url]: https://npmjs.org/package/egg-cluster
[codecov-image]: https://codecov.io/github/eggjs/egg-cluster/coverage.svg?branch=master
[codecov-url]: https://codecov.io/github/eggjs/egg-cluster?branch=master
[snyk-image]: https://snyk.io/test/npm/egg-cluster/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/egg-cluster
[download-image]: https://img.shields.io/npm/dm/egg-cluster.svg?style=flat-square
[download-url]: https://npmjs.org/package/egg-cluster

Cluster Manager for EggJS

---

## Install

```bash
npm i egg-cluster --save
```

## Usage

```js
const startCluster = require('egg-cluster').startCluster;
startCluster({
  baseDir: '/path/to/app',
  framework: '/path/to/framework',
});
```

You can specify a callback that will be invoked when application has started. However, master process will exit when catch an error.

```js
startCluster(options, () => {
  console.log('started');
});
```

## Options

| Param        | Type      | Description                              |
| ------------ | --------- | ---------------------------------------- |
| baseDir      | `String`  | directory of application                 |
| framework    | `String`  | specify framework that can be absolute path or npm package |
| plugins      | `Object`  | plugins for unittest                     |
| workers      | `Number`  | numbers of app workers                   |
| sticky       | `Boolean` | sticky mode server                       |
| port         | `Number`  | port                                     |
| debugPort    | `Number`  | the debug port only listen on http protocol |
| https        | `Object`  | start a https server, note: `key` / `cert` / `ca` should be full path to file |
| require      | `Array\|String` | will inject into worker/agent process |
| pidFile      | `String`  | will save master pid to this file |
| startMode    | `String`  | default is 'process', use 'worker_threads' to start the app & agent worker by worker_threads |
| ports        | `Array`   | startup port of each app worker, such as: [7001, 7002, 7003], only effects when the startMode is 'worker_threads' |
| env        | `String`   | custom env, default is process.env.EGG_SERVER_ENV |

## Env

EGG_APP_CLOSE_TIMEOUT: app worker boot timeout value

EGG_AGENT_CLOSE_TIMEOUT: agent worker boot timeout value

## License

[MIT](LICENSE)

<!-- GITCONTRIBUTOR_START -->

## Contributors

|[<img src="https://avatars.githubusercontent.com/u/360661?v=4" width="100px;"/><br/><sub><b>popomore</b></sub>](https://github.com/popomore)<br/>|[<img src="https://avatars.githubusercontent.com/u/156269?v=4" width="100px;"/><br/><sub><b>fengmk2</b></sub>](https://github.com/fengmk2)<br/>|[<img src="https://avatars.githubusercontent.com/u/227713?v=4" width="100px;"/><br/><sub><b>atian25</b></sub>](https://github.com/atian25)<br/>|[<img src="https://avatars.githubusercontent.com/u/985607?v=4" width="100px;"/><br/><sub><b>dead-horse</b></sub>](https://github.com/dead-horse)<br/>|[<img src="https://avatars.githubusercontent.com/u/6897780?v=4" width="100px;"/><br/><sub><b>killagu</b></sub>](https://github.com/killagu)<br/>|[<img src="https://avatars.githubusercontent.com/u/32174276?v=4" width="100px;"/><br/><sub><b>semantic-release-bot</b></sub>](https://github.com/semantic-release-bot)<br/>|
| :---: | :---: | :---: | :---: | :---: | :---: |
|[<img src="https://avatars.githubusercontent.com/u/5243774?v=4" width="100px;"/><br/><sub><b>ngot</b></sub>](https://github.com/ngot)<br/>|[<img src="https://avatars.githubusercontent.com/u/19908330?v=4" width="100px;"/><br/><sub><b>hyj1991</b></sub>](https://github.com/hyj1991)<br/>|[<img src="https://avatars.githubusercontent.com/u/5856440?v=4" width="100px;"/><br/><sub><b>whxaxes</b></sub>](https://github.com/whxaxes)<br/>|[<img src="https://avatars.githubusercontent.com/u/2170848?v=4" width="100px;"/><br/><sub><b>iyuq</b></sub>](https://github.com/iyuq)<br/>|[<img src="https://avatars.githubusercontent.com/u/2972143?v=4" width="100px;"/><br/><sub><b>nightink</b></sub>](https://github.com/nightink)<br/>|[<img src="https://avatars.githubusercontent.com/u/2160731?v=4" width="100px;"/><br/><sub><b>mansonchor</b></sub>](https://github.com/mansonchor)<br/>|
|[<img src="https://avatars.githubusercontent.com/u/10825163?v=4" width="100px;"/><br/><sub><b>ImHype</b></sub>](https://github.com/ImHype)<br/>|[<img src="https://avatars.githubusercontent.com/u/1207064?v=4" width="100px;"/><br/><sub><b>gxcsoccer</b></sub>](https://github.com/gxcsoccer)<br/>|[<img src="https://avatars.githubusercontent.com/u/1763067?v=4" width="100px;"/><br/><sub><b>waitingsong</b></sub>](https://github.com/waitingsong)<br/>|[<img src="https://avatars.githubusercontent.com/u/7581901?v=4" width="100px;"/><br/><sub><b>sjfkai</b></sub>](https://github.com/sjfkai)<br/>|[<img src="https://avatars.githubusercontent.com/u/26563778?v=4" width="100px;"/><br/><sub><b>ahungrynoob</b></sub>](https://github.com/ahungrynoob)<br/>|[<img src="https://avatars.githubusercontent.com/u/3230673?v=4" width="100px;"/><br/><sub><b>qingdengyue</b></sub>](https://github.com/qingdengyue)<br/>|
[<img src="https://avatars.githubusercontent.com/u/16320597?v=4" width="100px;"/><br/><sub><b>wenjiasen</b></sub>](https://github.com/wenjiasen)<br/>|[<img src="https://avatars.githubusercontent.com/u/418820?v=4" width="100px;"/><br/><sub><b>czy88840616</b></sub>](https://github.com/czy88840616)<br/>|[<img src="https://avatars.githubusercontent.com/u/9213756?v=4" width="100px;"/><br/><sub><b>gxkl</b></sub>](https://github.com/gxkl)<br/>

This project follows the git-contributor [spec](https://github.com/xudafeng/git-contributor), auto updated at `Mon Jun 03 2024 10:59:15 GMT+0800`.

<!-- GITCONTRIBUTOR_END -->
