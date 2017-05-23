'use strict';

module.exports = function* () {
  this.body = {
    frameworkCore: !!this.app.framework,
    frameworkPlugin: !!this.app.custom,
    frameworkAgent: !!this.app.agent,
  };
};
