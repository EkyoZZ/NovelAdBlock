// ==UserScript==
// @name         NovelAdBlock
// @namespace    https://github.com/NovelAdBlock
// @version      0.1.1
// @description  Block novel-site ad redirects, popups, injected scripts and frames.
// @match        *://*/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

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

/* NovelAdBlock core. Modules register rules and call install(). */
(function (root) {
  'use strict';
  const N = root.NovelAdBlock = root.NovelAdBlock || {};
  N.version = '0.1.1';
  N.rules = N.rules || [];
  N.features = N.features || [];
  N.log = N.log || function () {};
  N.registerRule = rule => N.rules.push(rule);
  N.registerFeature = feature => N.features.push(feature);
  N.activeRules = () => N.rules.filter(rule => !rule.hosts || rule.hosts.some(host => location.hostname === host || location.hostname.endsWith('.' + host)));
  N.blockedNames = () => new Set(N.activeRules().flatMap(rule => rule.disableGlobals || []));
  N.isBlockedUrl = function (url, kind) {
    let parsed;
    try { parsed = new URL(String(url), location.href); } catch (_) { return false; }
    if (!/^https?:$/.test(parsed.protocol)) return false;
    if (parsed.origin === location.origin) return false;
    return N.activeRules().some(rule => (rule.blockHosts || []).some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host)) || (rule.blockPatterns || []).some(pattern => pattern.test(parsed.href)) || (kind === 'popup' && rule.blockThirdPartyPopups));
  };
  N.guard = function (kind, value, fallback) {
    if (!N.isBlockedUrl(value, kind)) return false;
    N.log('BLOCK ' + kind, value);
    return fallback === undefined ? true : fallback;
  };
  N.disableKnownGlobals = function () {
    N.blockedNames().forEach(name => {
      try { Object.defineProperty(root, name, { configurable: true, get: () => function () { N.log('BLOCK global', name); }, set: () => {} }); } catch (_) {}
    });
  };
  N.install = function () {
    if (N.installed) return;
    N.installed = true;
    N.disableKnownGlobals();
    N.features.forEach(feature => { try { feature(N); } catch (error) { N.log('feature error', error); } });
    N.log('installed', { version: N.version, rules: N.activeRules().map(rule => rule.id) });
  };
})(window);

(function (root) {
  root.NovelAdBlock.registerRule({ id: 'generic', hosts: null, blockThirdPartyPopups: false, blockHosts: [], blockPatterns: [/\/(?:popunder|popup|redirect|adserver)\b/i] });
})(window);

(function (root) {
  root.NovelAdBlock.registerRule({ id: 'bicaaa-sdk', hosts: null, disableGlobals: ['bicaaa0', 'bicaaa1', 'bicaaa2', 'ziitrc'], blockHosts: [], blockPatterns: [/bicaaa|ziitrc/i] });
})(window);

(function (root) {
  root.NovelAdBlock.registerRule({ id: 'cloudflare-safe', hosts: null, blockHosts: [], blockPatterns: [] });
})(window);

(function (root) {
  root.NovelAdBlock.registerRule({
    id: 'tzkibb',
    hosts: ['tzkibb.com'],
    disableGlobals: ['bicaaa0', 'bicaaa1', 'bicaaa2', 'ziitrc'],
    blockTouchTracking: true,
    blockHosts: ['dkuhw.cn', '3333ai.top', 'bmjtlfhahyhhru.com'],
    blockPatterns: []
  });
})(window);

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

(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    ['setTimeout', 'setInterval'].forEach(name => {
      const original = root[name];
      root[name] = function (callback, delay) {
        if (typeof callback === 'string' && /(?:location|window\.open|document\.write|bicaaa|ziitrc)/i.test(callback)) { N.log('BLOCK ' + name, callback); return 0; }
        return original.apply(this, arguments);
      };
    });
  });
})(window);

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

(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    ['pushState', 'replaceState'].forEach(name => {
      const original = history[name];
      history[name] = function (state, title, url) { if (url && N.guard('history', url)) return; return original.apply(this, arguments); };
    });
  });
})(window);

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

;window.NovelAdBlock.install();
