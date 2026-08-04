// ==UserScript==
// @name         NovelAdBlock
// @namespace    https://github.com/NovelAdBlock
// @version      0.1.4
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
  N.version = '0.1.4';
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
    return N.activeRules().some(rule => {
      const allowedScript = (rule.allowedScriptHosts || []).some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
      return (rule.blockHosts || []).some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host)) ||
        (rule.blockPatterns || []).some(pattern => pattern.test(parsed.href)) ||
        (kind === 'popup' && rule.blockThirdPartyPopups) ||
        (kind === 'script' && rule.blockThirdPartyScripts && !allowedScript);
    });
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
  N.lockKnownGlobals = function () {
    N.blockedNames().forEach(name => {
      try {
        const stub = function () { N.log('BLOCK locked global', name); };
        Object.defineProperty(root, name, { configurable: false, enumerable: true, writable: false, value: stub });
      } catch (_) {}
    });
  };
  N.clearRuleStorage = function () {
    const patterns = N.activeRules().flatMap(rule => rule.clearSessionStoragePatterns || []);
    if (!patterns.length) return;
    try {
      const keys = [];
      for (let index = 0; index < sessionStorage.length; index += 1) keys.push(sessionStorage.key(index));
      keys.filter(key => key && patterns.some(pattern => pattern.test(key))).forEach(key => {
        sessionStorage.removeItem(key);
        N.log('CLEAR sessionStorage', key);
      });
    } catch (_) {}
  };
  N.install = function () {
    if (N.installed) return;
    N.installed = true;
    N.clearRuleStorage();
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
    lockGlobalsAfterScripts: [/\/css\/js\/tools\.js(?:[?#]|$)/i],
    blockTouchTracking: true,
    blockDocumentWrite: true,
    blockThirdPartyScripts: true,
    allowedScriptHosts: ['libs.baidu.com', 'static.cloudflareinsights.com', 'hm.baidu.com'],
    clearSessionStoragePatterns: [/^(?:currentPvIndex_|config_|data_|data\d+)/i],
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

(function (root) {
  'use strict';
  root.NovelAdBlock.registerFeature(function (N) {
    const blockPageTimers = N.activeRules().some(rule => rule.blockPageTimers);
    const originalTimeout = root.setTimeout;
    const originalInterval = root.setInterval;

    if (blockPageTimers) {
      const lastTimer = originalTimeout.call(root, function () {}, 0);
      root.clearTimeout(lastTimer);
      if (Number.isInteger(lastTimer) && lastTimer > 0 && lastTimer < 100000) {
        for (let id = 1; id <= lastTimer; id += 1) {
          root.clearTimeout(id);
          root.clearInterval(id);
        }
      }
      N.log('cleared existing page timers', lastTimer);
    }

    ['setTimeout', 'setInterval'].forEach(name => {
      const original = name === 'setTimeout' ? originalTimeout : originalInterval;
      root[name] = function (callback, delay) {
        if (blockPageTimers) { N.log('BLOCK page timer', { name: name, delay: delay }); return 0; }
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
