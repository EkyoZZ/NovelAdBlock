(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
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
