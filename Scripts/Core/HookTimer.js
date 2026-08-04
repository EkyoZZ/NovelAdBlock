(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    ['setTimeout', 'setInterval'].forEach(name => {
      const original = root[name];
      root[name] = function (callback, delay) {
        if (typeof callback === 'string' && /(?:location|window\.open|document\.write|bicaaa|ziitrc)/i.test(callback)) { N.log('BLOCK ' + name, callback); return 0; }
        return original.apply(this, arguments);
      };
    });
  });
})(window);
