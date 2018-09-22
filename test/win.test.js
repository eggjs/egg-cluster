'use strict';

const assert = require('assert');
const os = require('os');
const mm = require('egg-mock');
const parseKeyStr = require('../lib/utils/win').parseKeyStr;
const tmpDir = os.tmpdir();
const regex = /\\+/g;

describe('test/win.test.js', () => {
  afterEach(mm.restore);

  describe('should parseKeyStr() works', () => {
    it('should with title', () => {
      let title = 'foo';
      let ret = parseKeyStr({ title });
      assert(ret === title);

      title += '-c:\\foo\\bar\\';
      ret = parseKeyStr({ title });
      assert(ret === title.replace(regex, '/'));
    });

    it('should with baseDir', () => {
      const title = 'foo';
      const options = {
        baseDir: tmpDir,
      };
      const ret = parseKeyStr(options);
      assert(ret === tmpDir.replace(regex, '/') && ret !== title);
    });

    it('should title has high priority with both title and baseDir', () => {
      const title = 'foo';
      const options = {
        title,
        baseDir: tmpDir,
      };
      const ret = parseKeyStr(options);
      assert(ret === title && ret !== tmpDir.replace(regex, '/'));
    });

  });

});
