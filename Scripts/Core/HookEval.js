(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    const original = root.eval;
    root.eval = function (source) {
      if (typeof source === 'string' && /(?:bicaaa1|bicaaa2|ziitrc)/.test(source)) { N.log('BLOCK eval', source.slice(0, 160)); return; }
      return original.call(this, source);
    };
  });
})(window);
