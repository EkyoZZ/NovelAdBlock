/* NovelAdBlock core. Modules register rules and call install(). */
(function (root) {
  'use strict';
  const N = root.NovelAdBlock = root.NovelAdBlock || {};
  N.version = '0.2.7';
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
      const allowedIframe = (rule.allowedIframeHosts || []).some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host));
      return (rule.blockHosts || []).some(host => parsed.hostname === host || parsed.hostname.endsWith('.' + host)) ||
        (rule.blockPatterns || []).some(pattern => pattern.test(parsed.href)) ||
        (kind === 'popup' && rule.blockThirdPartyPopups) ||
        (kind === 'script' && rule.blockThirdPartyScripts && !allowedScript) ||
        (kind === 'iframe' && rule.blockThirdPartyIframes && !allowedIframe);
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
    if (root.__NovelAdBlockDecisionObserver && !root.__NovelAdBlockPageBootstrap && !root.__NovelAdBlockSkip) return;
    const cloudflareChallenge = root.__NovelAdBlockSkip || root._cf_chl_opt || /^Just a moment/i.test(document.title.trim()) ||
      location.pathname.startsWith('/cdn-cgi/') || /(?:^|[?&])__cf_chl_/i.test(location.search) ||
      !!document.querySelector('#challenge-running, #cf-challenge-running, script[src*="/cdn-cgi/challenge-platform/"], meta[http-equiv="content-security-policy"][content*="challenges.cloudflare.com"]') ||
      (document.documentElement.lang === 'en-US' && !!document.querySelector('meta[name="robots"][content*="noindex"]'));
    if (cloudflareChallenge) {
      N.log('skip Cloudflare challenge');
      return;
    }
    N.installed = true;
    N.clearRuleStorage();
    if (N.activeRules().some(rule => rule.lockGlobalsImmediately)) N.lockKnownGlobals();
    else N.disableKnownGlobals();
    N.features.forEach(feature => { try { feature(N); } catch (error) { N.log('feature error', error); } });
    N.log('installed', { version: N.version, rules: N.activeRules().map(rule => rule.id) });
  };
})(window);
