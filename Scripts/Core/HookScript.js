(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    const lockPatterns = N.activeRules().flatMap(rule => rule.lockGlobalsAfterScripts || []);
    const blockDocumentWrite = N.activeRules().some(rule => rule.blockDocumentWrite);
    const shouldLockAfter = src => lockPatterns.some(pattern => pattern.test(src));

    if (lockPatterns.length) {
      document.addEventListener('load', event => {
        const target = event.target;
        if (target && target.tagName === 'SCRIPT' && target.src && shouldLockAfter(target.src)) {
          N.lockKnownGlobals();
          N.log('locked globals after script', target.src);
        }
      }, true);

      try {
        const alreadyLoaded = performance.getEntriesByType('resource').some(entry => shouldLockAfter(entry.name));
        if (alreadyLoaded) N.lockKnownGlobals();
      } catch (_) {}
    }

    ['write', 'writeln'].forEach(method => {
      const originalWrite = document[method];
      document[method] = function () {
        if (blockDocumentWrite) {
          N.log('BLOCK document.' + method, Array.from(arguments).join('').slice(0, 160));
          return;
        }
        const markup = Array.from(arguments).join('');
        const sources = Array.from(markup.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi), match => match[1]);
        if (sources.some(src => N.guard('script', src))) {
          N.log('BLOCK document.' + method, sources);
          return;
        }
        return originalWrite.apply(this, arguments);
      };
    });

    const append = Node.prototype.appendChild;
    Node.prototype.appendChild = function (node) {
      if (node && node.tagName === 'SCRIPT' && node.src && N.guard('script', node.src)) return node;
      return append.call(this, node);
    };
    const insert = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (node, ref) {
      if (node && node.tagName === 'SCRIPT' && node.src && N.guard('script', node.src)) return node;
      return insert.call(this, node, ref);
    };
  });
})(window);
