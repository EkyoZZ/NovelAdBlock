(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    const original = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (/^touch(?:start|move|end)$/.test(type) && typeof listener === 'function') {
        const text = Function.prototype.toString.call(listener);
        if (/(?:bicaaa|ziitrc|location\.href|window\.open)/i.test(text)) { N.log('BLOCK touch listener', type); return; }
      }
      return original.call(this, type, listener, options);
    };
  });
})(window);
