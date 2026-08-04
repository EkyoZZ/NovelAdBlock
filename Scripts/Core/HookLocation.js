(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    const open = root.open;
    root.open = function (url) {
      if (url && N.guard('popup', url)) return null;
      return open.apply(this, arguments);
    };
    ['assign', 'replace'].forEach(method => {
      const original = Location.prototype[method];
      try { Location.prototype[method] = function (url) { if (!N.guard('navigation', url)) return original.call(this, url); }; } catch (_) {}
    });
    document.addEventListener('click', event => {
      const link = event.target.closest && event.target.closest('a[href]');
      if (link && N.guard('navigation', link.href)) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
  });
})(window);
