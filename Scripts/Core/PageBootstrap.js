/* Runs critical Tzkibb protections in the page's own JavaScript environment. */
(function () {
  'use strict';

  function installPageBootstrap(root) {
    if (root.__NovelAdBlockPageBootstrap || !/(^|\.)tzkibb\.com$/i.test(root.location.hostname)) return;
    Object.defineProperty(root, '__NovelAdBlockPageBootstrap', { configurable: false, value: true });

    const blockedGlobals = ['bicaaa0', 'bicaaa1', 'bicaaa2', 'ziitrc'];
    blockedGlobals.forEach(name => {
      try {
        Object.defineProperty(root, name, {
          configurable: false,
          enumerable: true,
          writable: false,
          value: function () {}
        });
      } catch (_) {}
    });

    try {
      const patterns = [/^(?:currentPvIndex_|config_|data_|data\d+)/i];
      const keys = [];
      for (let index = 0; index < root.sessionStorage.length; index += 1) keys.push(root.sessionStorage.key(index));
      keys.filter(key => key && patterns.some(pattern => pattern.test(key))).forEach(key => root.sessionStorage.removeItem(key));
    } catch (_) {}

    ['write', 'writeln'].forEach(method => {
      try { Object.defineProperty(root.document, method, { configurable: false, writable: false, value: function () {} }); } catch (_) {}
    });

    const stopTouchTracking = event => event.stopImmediatePropagation();
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(type => {
      root.addEventListener(type, stopTouchTracking, { capture: true, passive: true });
    });
  }

  installPageBootstrap(window);

  try {
    const script = document.createElement('script');
    script.textContent = '(' + installPageBootstrap.toString() + ')(window);';
    (document.documentElement || document.head || document.body).appendChild(script);
    script.remove();
  } catch (_) {}
})();
