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
