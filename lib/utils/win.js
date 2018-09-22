'use strict';

/**
 * set title of worker window
 *
 */

const parseKeyStr = options => {
  let title = options.title && typeof options.title === 'string'
    ? options.title
    : (options.baseDir && typeof options.baseDir === 'string' ? options.baseDir : '');

  title = title.replace(/\\+/g, '/');
  return title && title.length < 200 && title || '';
};
exports.parseKeyStr = parseKeyStr;

exports.setWinTitle = options => {
  const title = parseKeyStr(options);
  title && (process.title = title);
};

