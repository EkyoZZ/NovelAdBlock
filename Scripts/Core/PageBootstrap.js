/* Runs critical Tzkibb protections in the page's own JavaScript environment. */
(function () {
  'use strict';

  function installPageBootstrap(root) {
    if (root.__NovelAdBlockPageBootstrap || !/(^|\.)tzkibb\.com$/i.test(root.location.hostname)) return;
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

    ['write', 'writeln'].forEach(method => {
      try { Object.defineProperty(root.document, method, { configurable: false, writable: false, value: function () {} }); } catch (_) {}
    });

    const stopTouchTracking = event => event.stopImmediatePropagation();
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

    const allowedFrameHosts = ['challenges.cloudflare.com'];
    const removeThirdPartyFrame = frame => {
      if (!frame || frame.tagName !== 'IFRAME') return;
      let source;
      try { source = new URL(frame.src || 'about:blank', root.location.href); } catch (_) { frame.remove(); return; }
      if (source.protocol === 'about:' || source.origin === root.location.origin) return;
      const allowed = allowedFrameHosts.some(host => source.hostname === host || source.hostname.endsWith('.' + host));
      if (!allowed) frame.remove();
    };

    const scanFrames = node => {
      if (!node || node.nodeType !== 1) return;
      if (node.tagName === 'IFRAME') removeThirdPartyFrame(node);
      if (node.isConnected) Array.from(node.querySelectorAll('iframe')).forEach(removeThirdPartyFrame);
    };

    new MutationObserver(records => records.forEach(record => {
      if (record.type === 'attributes') removeThirdPartyFrame(record.target);
      record.addedNodes.forEach(scanFrames);
    })).observe(root.document, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
  }

  installPageBootstrap(window);

  try {
    const script = document.createElement('script');
    script.textContent = '(' + installPageBootstrap.toString() + ')(window);';
    (document.documentElement || document.head || document.body).appendChild(script);
    script.remove();
  } catch (_) {}
})();
