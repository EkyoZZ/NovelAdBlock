(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    const original = EventTarget.prototype.addEventListener;
    const touchTypes = new Set(['touchstart', 'touchmove', 'touchend', 'touchcancel']);
    const blockTouchTracking = N.activeRules().some(rule => rule.blockTouchTracking);

    if (blockTouchTracking) {
      const loggedTypes = new Set();
      const stopTrackedTouch = function (event) {
        event.stopImmediatePropagation();
        if (!loggedTypes.has(event.type)) {
          loggedTypes.add(event.type);
          N.log('BLOCK propagated touch event', event.type);
        }
      };

      touchTypes.forEach(type => {
        original.call(root, type, stopTrackedTouch, { capture: true, passive: true });
      });
    }

    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (touchTypes.has(type) && blockTouchTracking && (this === document || this === root)) {
        N.log('BLOCK page touch listener', type);
        return;
      }

      if (touchTypes.has(type) && typeof listener === 'function') {
        const text = Function.prototype.toString.call(listener);
        if (/(?:bicaaa|ziitrc|location\.href|window\.open)/i.test(text)) { N.log('BLOCK touch listener', type); return; }
      }
      return original.call(this, type, listener, options);
    };
  });
})(window);
