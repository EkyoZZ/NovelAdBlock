(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    const blockPageTimers = N.activeRules().some(rule => rule.blockPageTimers);
    const originalTimeout = root.setTimeout;
    const originalInterval = root.setInterval;

    if (blockPageTimers) {
      const lastTimer = originalTimeout.call(root, function () {}, 0);
      root.clearTimeout(lastTimer);
      if (Number.isInteger(lastTimer) && lastTimer > 0 && lastTimer < 100000) {
        for (let id = 1; id <= lastTimer; id += 1) {
          root.clearTimeout(id);
          root.clearInterval(id);
        }
      }
      N.log('cleared existing page timers', lastTimer);
    }

    ['setTimeout', 'setInterval'].forEach(name => {
      const original = name === 'setTimeout' ? originalTimeout : originalInterval;
      root[name] = function (callback, delay) {
        if (blockPageTimers) { N.log('BLOCK page timer', { name: name, delay: delay }); return 0; }
        if (typeof callback === 'string' && /(?:location|window\.open|document\.write|bicaaa|ziitrc)/i.test(callback)) { N.log('BLOCK ' + name, callback); return 0; }
        return original.apply(this, arguments);
      };
    });
  });
})(window);
