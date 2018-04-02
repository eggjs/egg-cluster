'use strict';

/**
 * set title of worker window
 *
 */


exports.setWinTitle = options => {
  let title = options.title && typeof options.title === 'string'
    ? options.title
    : (options.baseDir && typeof options.baseDir === 'string' ? options.baseDir : '');

  title = title.replace(/\\+/g, '/');
  title && title.length < 200 && (process.title = title);
};

