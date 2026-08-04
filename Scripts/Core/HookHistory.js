(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    ['pushState', 'replaceState'].forEach(name => {
      const original = history[name];
      history[name] = function (state, title, url) { if (url && N.guard('history', url)) return; return original.apply(this, arguments); };
    });
  });
})(window);
