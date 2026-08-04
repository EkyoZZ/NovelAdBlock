/* Runs critical Tzkibb protections in the page's own JavaScript environment. */
(function () {
  'use strict';

  function installPageBootstrap(root) {
    const isCloudflareChallenge = function () {
      try {
        return !!root._cf_chl_opt ||
          /^Just a moment/i.test(root.document.title.trim()) ||
          root.location.pathname.startsWith('/cdn-cgi/') ||
          /(?:^|[?&])__cf_chl_/i.test(root.location.search) ||
          !!root.document.querySelector('#challenge-running, #cf-challenge-running, script[src*="/cdn-cgi/challenge-platform/"], meta[http-equiv="content-security-policy"][content*="challenges.cloudflare.com"]') ||
          (root.document.documentElement.lang === 'en-US' && !!root.document.querySelector('meta[name="robots"][content*="noindex"]'));
      } catch (_) { return false; }
    };

    const isNovelPage = function () {
      try {
        return !!root.document.querySelector('script[src*="/css/js/wap.js"], script[src*="/css/js/tools.js"]');
      } catch (_) { return false; }
    };

    if (isCloudflareChallenge()) {
      try { Object.defineProperty(root, '__NovelAdBlockSkip', { configurable: true, value: true }); } catch (_) { root.__NovelAdBlockSkip = true; }
      if (root.__NovelAdBlockDecisionObserver) root.__NovelAdBlockDecisionObserver.disconnect();
      return;
    }

    if (root.document.readyState === 'loading' && !isNovelPage()) {
      if (!root.__NovelAdBlockDecisionObserver) {
        const observer = new MutationObserver(function () { installPageBootstrap(root); });
        try { Object.defineProperty(root, '__NovelAdBlockDecisionObserver', { configurable: true, value: observer }); }
        catch (_) { root.__NovelAdBlockDecisionObserver = observer; }
        observer.observe(root.document, { childList: true, subtree: true });
        root.document.addEventListener('DOMContentLoaded', function () { installPageBootstrap(root); }, { once: true });
      }
      return;
    }

    if (root.__NovelAdBlockPageBootstrap || !/(^|\.)tzkibb\.com$/i.test(root.location.hostname)) return;
    if (root.__NovelAdBlockDecisionObserver) root.__NovelAdBlockDecisionObserver.disconnect();
    Object.defineProperty(root, '__NovelAdBlockPageBootstrap', { configurable: false, value: true });

    try {
      const currentUrl = new URL(root.location.href);
      if (currentUrl.searchParams.has('_novel_adblock')) {
        currentUrl.searchParams.delete('_novel_adblock');
        root.history.replaceState(root.history.state, root.document.title, currentUrl.href);
      }
    } catch (_) {}

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

    const stopTouchTracking = event => {
      const target = event.target;
      if (target && target.tagName === 'IFRAME') {
        try {
          const source = new URL(target.src, root.location.href);
          if (source.hostname === 'challenges.cloudflare.com' || source.hostname.endsWith('.challenges.cloudflare.com')) return;
        } catch (_) {}
      }
      event.stopImmediatePropagation();
    };
    ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(type => {
      root.addEventListener(type, stopTouchTracking, { capture: true, passive: true });
    });

    const findChapterLink = event => {
      const elements = [];
      if (event.target && event.target.nodeType === 1) elements.push(event.target);
      if (typeof root.document.elementsFromPoint === 'function') {
        elements.push.apply(elements, root.document.elementsFromPoint(event.clientX, event.clientY));
      }

      for (const element of elements) {
        const link = element.closest && element.closest('a[href]');
        if (!link) continue;
        const label = (link.textContent || '').replace(/\s+/g, '');
        if (/^(?:上一章|下一章|上一页|下一页)$/.test(label)) return link;
      }
      return null;
    };

    root.addEventListener('click', event => {
      if (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = findChapterLink(event);
      if (!link) return;

      let destination;
      try { destination = new URL(link.href, root.location.href); } catch (_) { return; }
      if (destination.origin !== root.location.origin) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      root.location.assign(destination.href);
    }, true);

    try {
      if (root.NovelAdBlock && !root.NovelAdBlock.installed) root.NovelAdBlock.install();
    } catch (_) {}

  }

  installPageBootstrap(window);

  try {
    const script = document.createElement('script');
    script.textContent = '(' + installPageBootstrap.toString() + ')(window);';
    (document.documentElement || document.head || document.body).appendChild(script);
    script.remove();
  } catch (_) {}
})();
