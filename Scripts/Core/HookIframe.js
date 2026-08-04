(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      const frames = node.matches('iframe[src]') ? [node] : Array.from(node.querySelectorAll?.('iframe[src]') || []);
      frames.forEach(frame => { if (N.guard('iframe', frame.src)) frame.remove(); });
    }))).observe(document.documentElement, { childList: true, subtree: true });
  });
})(window);
