/* NovelAdBlock diagnostic logger. Load before Core.js. */
(function (root) {
  'use strict';
  const N = root.NovelAdBlock = root.NovelAdBlock || {};
  N.debug = N.debug ?? false;
  N.log = function (action, detail) {
    if (!N.debug) return;
    console.info('[NovelAdBlock]', action, detail || '');
  };
})(window);
