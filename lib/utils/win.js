'use strict';

/**
 * set WindowsTitle
 *
 */


exports.setWinTitle = (options) => {
  if (process.platform === 'win32') {
    const winTitle = options.title && typeof options.title === 'string' && options.title.length < 200
      ? options.title
      : (options.baseDir && options.baseDir.length < 200 ? options.baseDir : '');

    winTitle && (process.title = winTitle);
  }
};
