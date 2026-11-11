import type { IconName } from '../components/Icons';

/**
 * Each app in the collection is its mobile website running inside our own
 * full-screen view. A "feature" is one part of it we can block: we refuse to
 * visit its URLs and hide the buttons that lead there.
 *
 * Only things that live at their own address can be blocked this way. Calls,
 * for example, don't exist on these mobile sites, so there is nothing to switch.
 *
 * The URL rules are the dependable part. The CSS selectors are best-effort:
 * these sites change their markup often, so expect to update them over time.
 */
export type Feature = {
  id: string;
  label: string;
  hint: string;
  /** Switched on when the app is added. The endless feeds are; things like messages are not. */
  defaultOn?: boolean;
  /** Regex sources tested against location.pathname. */
  paths: string[];
  /**
   * Pages that share an address with normal content (an Instagram /p/ link can be a reel).
   * Blocked only when the path matches AND the selector is found on the page.
   */
  probes?: { path: string; sel: string }[];
  css: string;
  /** Where to send the user instead (default: the app's home). */
  redirect?: string;
  /** Redirect quietly, without the intercept screen. */
  silent?: boolean;
};

export type Site = {
  id: string;
  name: string;
  icon: IconName;
  url: string;
  /** Hostname suffix; rules only apply on this site. */
  host: string;
  /** Path of the inbox, if the app has one, for the intercept screen's shortcut. */
  inbox?: string;
  features: Feature[];
};

const hide = (...selectors: string[]) => selectors.join(',') + '{display:none!important}';

export const SITES: Site[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: 'camera',
    url: 'https://www.instagram.com/',
    host: 'instagram.com',
    inbox: '/direct/inbox/',
    features: [
      {
        id: 'reels',
        label: 'Reels',
        hint: 'Tab hidden. Reels from friends, shared links and swiping to the next reel are all stopped.',
        defaultOn: true,
        // /reels/ (feed), /reel/CODE (a shared reel), /share/reel/CODE (share links), /user/reel/CODE.
        paths: ['^/reels?(/|$)', '^/share/(reel|r)(/|$)', '^/[^/]+/reels?(/|$)'],
        probes: [{ path: '^/p/', sel: 'a[href*="/reels/audio/"]' }],
        css: hide('a[href="/reels/"]', 'a[href^="/reels/"]', 'a[href*="/reel/"]', 'a[href*="/share/reel/"]'),
      },
      {
        id: 'explore',
        label: 'Explore',
        hint: 'Search still works, the grid is skipped.',
        defaultOn: true,
        paths: ['^/explore/?$'],
        css: '',
        redirect: '/explore/search/',
        silent: true,
      },
      {
        id: 'stories',
        label: 'Stories',
        hint: 'Story viewer is skipped.',
        paths: ['^/stories(/|$)'],
        css: hide('a[href^="/stories/"]'),
      },
      {
        id: 'messages',
        label: 'Messages',
        hint: 'Direct messages are skipped.',
        paths: ['^/direct(/|$)'],
        css: hide('a[href^="/direct/"]'),
      },
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: 'play',
    url: 'https://m.youtube.com/',
    host: 'youtube.com',
    features: [
      {
        id: 'shorts',
        label: 'Shorts',
        hint: 'Shelf and tab removed. Normal videos stay.',
        defaultOn: true,
        paths: ['^/shorts(/|$)', '^/feed/shorts', '^/@[^/]+/shorts(/|$)', '^/(c|channel|user)/[^/]+/shorts(/|$)'],
        css: hide(
          'ytm-reel-shelf-renderer',
          'ytm-shorts-lockup-view-model',
          'ytm-shorts-lockup-view-model-v2',
          'ytm-rich-section-renderer:has(a[href^="/shorts"])',
          'grid-shelf-view-model:has(a[href^="/shorts"])',
          'ytm-pivot-bar-item-renderer:has(.pivot-shorts)',
          'ytm-video-with-context-renderer:has(a[href^="/shorts"])',
          'a[href^="/shorts"]',
        ),
      },
      {
        id: 'home',
        label: 'Home feed',
        hint: 'Opens your Subscriptions instead of recommendations.',
        paths: ['^/?$'],
        css: '',
        redirect: '/feed/subscriptions',
        silent: true,
      },
      {
        id: 'trending',
        label: 'Trending',
        hint: 'Trending and Explore pages are skipped.',
        paths: ['^/feed/(trending|explore)'],
        css: hide('a[href^="/feed/trending"]', 'a[href^="/feed/explore"]'),
        redirect: '/feed/subscriptions',
      },
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: 'users',
    url: 'https://m.facebook.com/',
    host: 'facebook.com',
    inbox: '/messages/',
    features: [
      {
        id: 'reels',
        label: 'Reels',
        hint: 'Reels tab, shared reel links and swiping to the next reel are stopped.',
        defaultOn: true,
        paths: ['^/reels?(/|$)', '^/share/(r|reel)(/|$)', '^/[^/]+/reels?(/|$)', '^/watch/reels?(/|$)'],
        css: hide('a[href*="/reel/"]', 'a[href*="/reels/"]', 'a[href*="/share/r/"]'),
      },
      {
        id: 'watch',
        label: 'Watch',
        hint: 'The video feed is skipped.',
        defaultOn: true,
        paths: ['^/watch(/|$)'],
        css: hide('a[href^="/watch"]', 'a[href*="facebook.com/watch"]'),
      },
      {
        id: 'marketplace',
        label: 'Marketplace',
        hint: 'Marketplace is skipped.',
        paths: ['^/marketplace(/|$)'],
        css: hide('a[href^="/marketplace"]', 'a[href*="facebook.com/marketplace"]'),
      },
      {
        id: 'messages',
        label: 'Messages',
        hint: 'The inbox is skipped.',
        paths: ['^/messages(/|$)'],
        css: hide('a[href^="/messages"]'),
      },
    ],
  },
  {
    id: 'x',
    name: 'X',
    icon: 'close',
    url: 'https://x.com/home',
    host: 'x.com',
    inbox: '/messages',
    features: [
      {
        id: 'explore',
        label: 'Explore',
        hint: 'Explore and Trending are skipped. Your timeline stays.',
        defaultOn: true,
        paths: ['^/explore(/|$)', '^/i/trends'],
        css: hide('a[href="/explore"]', 'a[href^="/explore/"]', 'a[href^="/i/trends"]'),
        redirect: '/home',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        hint: 'The notifications page is skipped.',
        paths: ['^/notifications(/|$)'],
        css: hide('a[href="/notifications"]'),
        redirect: '/home',
      },
      {
        id: 'messages',
        label: 'Messages',
        hint: 'Direct messages are skipped.',
        paths: ['^/messages(/|$)'],
        css: hide('a[href="/messages"]'),
        redirect: '/home',
      },
    ],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: 'smile',
    url: 'https://www.reddit.com/',
    host: 'reddit.com',
    features: [
      {
        id: 'popular',
        label: 'Popular',
        hint: 'The Popular and All feeds are skipped. Your communities stay.',
        defaultOn: true,
        paths: ['^/r/(popular|all)(/|$)'],
        css: hide('a[href^="/r/popular"]', 'a[href^="/r/all"]'),
      },
    ],
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: 'user',
    url: 'https://www.threads.com/',
    host: 'threads.com',
    features: [
      {
        id: 'search',
        label: 'Explore',
        hint: 'The Search and discovery page is skipped. Your feed stays.',
        defaultOn: true,
        paths: ['^/search(/|$)'],
        css: hide('a[href="/search"]', 'a[href^="/search/"]'),
        redirect: '/',
      },
      {
        id: 'activity',
        label: 'Activity',
        hint: 'The activity page is skipped.',
        paths: ['^/activity(/|$)'],
        css: hide('a[href="/activity"]', 'a[href^="/activity/"]'),
        redirect: '/',
      },
    ],
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: 'sparkle',
    url: 'https://www.pinterest.com/',
    host: 'pinterest.com',
    features: [
      {
        id: 'ideas',
        label: 'Explore',
        hint: 'The Explore and ideas pages are skipped. Search and your boards stay.',
        defaultOn: true,
        paths: ['^/ideas(/|$)'],
        css: hide('a[href="/ideas/"]', 'a[href^="/ideas/"]'),
        redirect: '/',
      },
      {
        id: 'watch',
        label: 'Watch',
        hint: 'The video feed is skipped.',
        defaultOn: true,
        paths: ['^/watch(/|$)'],
        css: hide('a[href="/watch/"]', 'a[href^="/watch/"]'),
        redirect: '/',
      },
      {
        id: 'today',
        label: 'Today',
        hint: 'The daily picks page is skipped.',
        paths: ['^/today(/|$)'],
        css: hide('a[href="/today/"]', 'a[href^="/today/"]'),
        redirect: '/',
      },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'briefcase',
    url: 'https://www.linkedin.com/jobs/',
    host: 'linkedin.com',
    inbox: '/messaging/',
    features: [
      {
        id: 'video',
        label: 'Videos',
        hint: 'The video feed is skipped.',
        defaultOn: true,
        paths: ['^/video(/|$)'],
        css: hide('a[href*="/video/"]'),
        redirect: '/jobs/',
      },
      {
        id: 'feed',
        label: 'Home feed',
        hint: 'Opens Jobs instead of the feed.',
        paths: ['^/feed/?$'],
        css: '',
        redirect: '/jobs/',
        silent: true,
      },
      {
        id: 'notifications',
        label: 'Notifications',
        hint: 'The notifications page is skipped.',
        paths: ['^/notifications(/|$)'],
        css: hide('a[href*="/notifications/"]'),
        redirect: '/jobs/',
      },
      {
        id: 'messages',
        label: 'Messages',
        hint: 'The inbox is skipped.',
        paths: ['^/messaging(/|$)'],
        css: hide('a[href*="/messaging/"]'),
        redirect: '/jobs/',
      },
    ],
  },
  {
    id: 'twitch',
    name: 'Twitch',
    icon: 'play',
    url: 'https://m.twitch.tv/',
    host: 'twitch.tv',
    features: [
      {
        id: 'browse',
        label: 'Browse',
        hint: 'Discovery pages are skipped. A channel you open directly still plays.',
        defaultOn: true,
        paths: ['^/directory(/|$)'],
        css: hide('a[href="/directory"]', 'a[href^="/directory/"]'),
        redirect: '/',
      },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: 'play',
    url: 'https://www.tiktok.com/search',
    host: 'tiktok.com',
    features: [
      {
        id: 'foryou',
        label: 'For You',
        hint: 'The video feed, shared video links and swiping to the next video are stopped. Search stays.',
        defaultOn: true,
        paths: ['^/?$', '^/foryou(/|$)', '^/following(/|$)', '^/explore(/|$)', '^/live(/|$)', '^/@[^/]+/video/', '^/@[^/]+/photo/', '^/(video|embed|v|t)/'],
        css: hide('a[href*="/video/"]', 'a[href^="/foryou"]', 'a[href^="/explore"]', 'a[href^="/following"]'),
        redirect: '/search',
      },
    ],
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    icon: 'camera',
    url: 'https://www.snapchat.com/',
    host: 'snapchat.com',
    features: [
      {
        id: 'spotlight',
        label: 'Spotlight',
        hint: 'Spotlight videos, shared Spotlight links and swiping to the next one are stopped.',
        defaultOn: true,
        paths: ['^/spotlight(/|$)', '^/[a-z]{2}(-[A-Za-z]{2})?/spotlight(/|$)', '^/discover(/|$)', '^/p/'],
        css: hide('a[href*="/spotlight"]', 'a[href*="/discover"]'),
        redirect: '/',
      },
    ],
  },
];

export const siteById = (id: string) => SITES.find((s) => s.id === id);

export const featureKey = (site: Site, f: Feature) => `${site.id}-${f.id}`;

/** Keys switched on when these apps are first added. */
export const defaultKeys = (appIds: string[]) =>
  SITES.filter((s) => appIds.includes(s.id)).flatMap((s) => s.features.filter((f) => f.defaultOn).map((f) => featureKey(s, f)));

/** Features of this app that are switched on. `on` holds the enabled keys. */
export const activeFeatures = (site: Site, on: string[]) => site.features.filter((f) => on.includes(featureKey(site, f)));

/** "Reels & Explore" for the features currently blocked in this app. */
export const cutLabel = (site: Site, on: string[]) =>
  activeFeatures(site, on)
    .map((f) => f.label)
    .join(' & ');

/** Full names for the plan summary, e.g. "Instagram Reels". */
export const cutsFor = (ids: string[]) =>
  SITES.filter((s) => ids.includes(s.id)).flatMap((s) => s.features.filter((f) => f.defaultOn).map((f) => `${s.name} ${f.label}`));

/** How many features are switched on across the user's apps. */
export const totalActive = (on: string[], apps: string[]) =>
  SITES.filter((s) => apps.includes(s.id)).reduce((n, s) => n + activeFeatures(s, on).length, 0);

/** The active feature this URL belongs to, if any. */
export function blockedFeature(site: Site, url: string, on: string[]): Feature | null {
  const m = /^https?:\/\/([^/?#]+)([^?#]*)/i.exec(url);
  if (!m) return null;
  const host = m[1].toLowerCase();
  if (host !== site.host && !host.endsWith('.' + site.host)) return null;
  const path = m[2] || '/';
  return activeFeatures(site, on).find((f) => f.paths.some((r) => new RegExp(r).test(path))) ?? null;
}

/** Links that would leave the app (App Store, app deep links). These are never followed. */
export function isExternalUrl(url: string) {
  if (/^(about:|data:|blob:)/i.test(url)) return false;
  if (!/^https?:/i.test(url)) return true;
  return /^https?:\/\/(apps|itunes)\.apple\.com/i.test(url);
}

/** Script injected into the page. Safe to inject repeatedly; it just updates the rules and on/off flag. */
export function blockerScript(site: Site, blocking: boolean, on: string[]) {
  const feats = activeFeatures(site, on);
  const rules = [
    ...feats.flatMap((f) => f.paths.map((re) => ({ re, id: f.id, to: f.redirect ?? '/', silent: !!f.silent, sel: '' }))),
    ...feats.flatMap((f) => (f.probes ?? []).map((p) => ({ re: p.path, id: f.id, to: f.redirect ?? '/', silent: !!f.silent, sel: p.sel }))),
  ];
  const css = feats.map((f) => f.css).filter(Boolean).join('\n');
  return `(function(){
  var S = window.__brk = window.__brk || {};
  S.on = ${blocking ? 'true' : 'false'};
  S.rules = ${JSON.stringify(rules)};
  S.css = ${JSON.stringify(css)};
  function style(){
    var el = document.getElementById('brk-style');
    if (S.on && S.css) {
      if (!el && (document.head || document.documentElement)) {
        el = document.createElement('style'); el.id = 'brk-style';
        (document.head || document.documentElement).appendChild(el);
      }
      if (el && el.textContent !== S.css) el.textContent = S.css;
    } else if (el) { el.remove(); }
  }
  function hit(p){
    for (var i = 0; i < S.rules.length; i++) {
      var r = S.rules[i];
      if (!new RegExp(r.re).test(p)) continue;
      if (r.sel) { try { if (!document.querySelector(r.sel)) continue; } catch (e) { continue; } }
      return r;
    }
    return null;
  }
  function guard(){
    if (!S.on) return;
    var r = hit(location.pathname);
    if (!r) return;
    if (!r.silent) { try { window.ReactNativeWebView.postMessage('blocked:' + r.id); } catch (e) {} }
    location.replace(r.to);
  }
  if (!S.hooked) {
    S.hooked = true;
    // Single-page apps move between reels with pushState, so check the moment the address
    // changes instead of waiting for the next tick. This is what stops "swipe to the next reel".
    ['pushState', 'replaceState'].forEach(function(k){
      var orig = history[k];
      history[k] = function(){ var out = orig.apply(this, arguments); try { guard(); } catch (e) {} return out; };
    });
    window.addEventListener('popstate', function(){ guard(); });
    // Catch taps on links to blocked pages (a reel shared in a chat, a reel card in the feed)
    // before the page opens them.
    document.addEventListener('click', function(ev){
      if (!S.on) return;
      var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
      if (!a) return;
      var u; try { u = new URL(a.href, location.href); } catch (e) { return; }
      if (u.hostname !== location.hostname && !u.hostname.endsWith('.' + location.hostname.replace(/^(www|m)\\./, ''))) return;
      var r = hit(u.pathname);
      if (r && !r.sel) {
        ev.preventDefault(); ev.stopPropagation();
        if (!r.silent) { try { window.ReactNativeWebView.postMessage('blocked:' + r.id); } catch (e) {} }
      }
    }, true);
    // Videos from a blocked page should never keep playing underneath the pop-up.
    document.addEventListener('play', function(ev){
      if (S.on && hit(location.pathname) && ev.target && ev.target.pause) ev.target.pause();
    }, true);
  }
  // Always on: hide 'open in app' prompts so the site behaves like an app of its own.
  var KILL = /^(open app|open in app|open the app|use the app|use app|get the app|get app|open instagram|open tiktok|open snapchat|open youtube|open facebook|open reddit|open threads|open pinterest|open linkedin|open twitch|switch to the app|continue in app)$/i;
  function tidy(){
    var els = document.querySelectorAll('a,button,[role="button"]');
    for (var i = 0; i < els.length && i < 800; i++) {
      var e = els[i];
      var t = (e.innerText || '').trim();
      var h = (e.getAttribute && e.getAttribute('href')) || '';
      if ((t.length < 28 && KILL.test(t)) || /(apps|itunes)\\.apple\\.com/.test(h)) e.style.setProperty('display', 'none', 'important');
    }
  }
  S.n = S.n || 0;
  if (!S.timer) S.timer = setInterval(function(){ style(); guard(); if (++S.n % 3 === 0) tidy(); }, 400);
  style(); guard(); tidy();
})(); true;`;
}
