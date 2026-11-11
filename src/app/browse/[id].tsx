import { Redirect, router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { AppTile } from '../../components/AppTile';
import { Icon } from '../../components/Icons';
import { useGate } from '../../components/UnblockGate';
import { PrimaryButton, Up } from '../../components/ui';
import { blockState, fmtWhen } from '../../data/schedule';
import { blockedFeature, blockerScript, cutLabel, isExternalUrl, Site, siteById } from '../../data/sites';
import { breathe, fade, pop, pulse } from '../../lib/anim';
import { tap } from '../../lib/haptics';
import { UNLOCK_MIN, useNow, useStore } from '../../lib/store';
import { APP_NAME, c, f } from '../../theme';

const ordinal = (n: number) => {
  const v = n % 100;
  const suffix = v >= 11 && v <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${suffix}`;
};

/**
 * Runs one of the collection's apps full screen, with its short-video feeds
 * cut while blocking is active. No address bar or browser toolbar: just a slim
 * strip to get back to the collection.
 */
export default function AppScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const site = siteById(id ?? '');
  const insets = useSafeAreaInsets();
  const { schedule, pauseUntil, focusUntil, on, recordDodge, addSeconds } = useStore();
  const now = useNow(15000);
  const web = useRef<WebView<{}>>(null);
  const [loading, setLoading] = useState(true);
  const [intercept, setIntercept] = useState<string | null>(null);
  const lastDodge = useRef(0);

  const { blocked, change } = blockState(schedule, { pauseUntil, focusUntil }, now);
  const script = site ? blockerScript(site, blocked, on) : '';

  // Push the current rules into the page whenever blocking or the feature switches change.
  useEffect(() => {
    if (script) web.current?.injectJavaScript(script);
  }, [script]);

  // Count time spent in the app, in 10-second steps.
  useEffect(() => {
    const t = setInterval(() => addSeconds(10), 10000);
    return () => clearInterval(t);
  }, [addSeconds]);

  if (!site) return <Redirect href="/(tabs)" />;

  const dodge = (label: string) => {
    // The page and the navigation hook can both report the same attempt.
    if (Date.now() - lastDodge.current < 1500) return;
    lastDodge.current = Date.now();
    recordDodge(site.id);
    setIntercept(label);
  };

  const label = cutLabel(site, on);
  // Offer the inbox shortcut only if messages are not themselves blocked.
  const inbox = site.inbox && !blockedFeature(site, `https://${site.host}${site.inbox}`, on) ? site.inbox : null;
  const until = change ? ` until ${fmtWhen(change, now)}` : '';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      {/* Slim strip: back to the collection, and what is cut right now */}
      <View style={s.strip}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Back to ${APP_NAME}`}
          hitSlop={12}
          onPress={() => {
            tap();
            router.back();
          }}
          style={s.home}>
          <Icon name="chevronLeft" size={16} color={c.text} width={2.4} />
          <Text style={s.homeText}>{APP_NAME}</Text>
        </Pressable>
        <View style={[s.status, { backgroundColor: blocked && label ? c.selected : c.chip }]}>
          <Icon name={blocked && label ? 'shield' : 'unlock'} size={12} color={blocked && label ? c.accent : c.muted} width={2.4} />
          <Text style={[s.statusText, { color: blocked && label ? c.accent : c.muted }]} numberOfLines={1}>
            {blocked && label ? `${label} off${until}` : `Nothing blocked${until}`}
          </Text>
        </View>
      </View>

      {Platform.OS === 'web' ? (
        <View style={s.fallback}>
          <AppTile id={site.id} size={84} />
          <Text style={s.fallbackText}>
            {site.name} runs inside {APP_NAME} on a phone. Open {APP_NAME} on your iPhone to use it.
          </Text>
          <Pressable accessibilityRole="button" onPress={() => dodge(site.features[0].label)} style={s.preview}>
            <Text style={s.previewText}>Preview the intercept screen</Text>
          </Pressable>
        </View>
      ) : (
        <WebView<{}>
          ref={web}
          source={{ uri: site.url }}
          style={{ flex: 1, backgroundColor: c.bg }}
          containerStyle={{ backgroundColor: c.bg }}
          injectedJavaScriptBeforeContentLoaded={script}
          injectedJavaScript={script}
          onMessage={(e) => {
            const data = e.nativeEvent.data;
            if (data.startsWith('blocked:')) {
              const feat = site.features.find((x) => x.id === data.slice(8));
              dodge(feat?.label ?? 'This feed');
            }
          }}
          onShouldStartLoadWithRequest={(req) => {
            // Never jump out to the App Store or another app.
            if (isExternalUrl(req.url)) return false;
            const feat = blocked ? blockedFeature(site, req.url, on) : null;
            if (feat && !feat.silent) {
              dodge(feat.label);
              return false;
            }
            return true;
          }}
          onLoadEnd={() => setLoading(false)}
          sharedCookiesEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          allowsBackForwardNavigationGestures
          allowsLinkPreview={false}
          pullToRefreshEnabled
          decelerationRate="normal"
          setSupportMultipleWindows={false}
        />
      )}

      {/* Launch screen, so opening feels like starting an app rather than loading a page */}
      {loading && Platform.OS !== 'web' && (
        <Animated.View style={[s.launch, { top: insets.top + 44 }, fade()]} pointerEvents="none">
          <View style={s.launchIcon}>
            <Animated.View style={[s.launchRing, pulse()]} />
            <Animated.View style={pop(0, 450, 0.6, 1.08)}>
              <AppTile id={site.id} size={96} />
            </Animated.View>
          </View>
          <Text style={s.launchName}>{site.name}</Text>
          <Text style={s.launchSub}>{blocked && label ? `Without ${label}` : 'Opening'}</Text>
        </Animated.View>
      )}

      {intercept && (
        <Intercept
          site={site}
          inbox={inbox}
          feature={intercept}
          onDismiss={() => setIntercept(null)}
          onInbox={() => {
            if (inbox) web.current?.injectJavaScript(`location.href=${JSON.stringify(inbox)};true;`);
            setIntercept(null);
          }}
        />
      )}
    </View>
  );
}

/** Full-screen pause shown when a cut feed is opened. */
function Intercept({
  site,
  inbox,
  feature,
  onDismiss,
  onInbox,
}: {
  site: Site;
  inbox: string | null;
  feature: string;
  onDismiss: () => void;
  onInbox: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { today, budgetLeft, unlock, focusUntil, settings } = useStore();
  const gate = useGate();
  const [inhale, setInhale] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setInhale((v) => !v), 4000);
    return () => clearInterval(t);
  }, []);

  const strictFocus = settings.strict && !!focusUntil && Date.now() < focusUntil;
  const canUnlock = !strictFocus && budgetLeft >= UNLOCK_MIN;

  return (
    <Animated.View style={[s.cover, { paddingTop: insets.top + 12, paddingBottom: Math.max(insets.bottom + 8, 28) }, fade()]}>
      <View style={s.coverTop}>
        <View style={s.badge}>
          <AppTile id={site.id} size={20} />
          <Text style={s.badgeText}>
            {site.name} · {feature}
          </Text>
        </View>
        <Text style={s.by}>Blocked by {APP_NAME}</Text>
      </View>

      {/* Breathing rings */}
      <View style={s.ringsWrap}>
        <Animated.View style={[s.rings, breathe]}>
          <View style={[s.ring, { top: 0, left: 0, right: 0, bottom: 0, borderRadius: 130, borderColor: c.border }]} />
          <View style={[s.ring, { top: 30, left: 30, right: 30, bottom: 30, borderRadius: 100, borderColor: '#33333D' }]} />
          <View style={s.halo} />
          <View style={s.core}>
            <Icon name="shield" size={40} color={c.onAccent} />
          </View>
        </Animated.View>
      </View>

      <View style={{ gap: 10, marginBottom: 24 }}>
        <Up>
          <Text style={s.kicker}>{inhale ? 'Breathe in · 4s' : 'Breathe out · 4s'}</Text>
        </Up>
        <Up delay={60}>
          <Text style={s.title}>
            {feature} is blocked.{'\n'}The rest of {site.name} isn’t.
          </Text>
        </Up>
        <Up delay={120}>
          <Text style={s.body}>
            This is your {ordinal(today.dodges)} try today.{' '}
            {strictFocus
              ? 'A strict focus session is running, so there are no unlocks until it ends.'
              : canUnlock
                ? `You’ve still got ${budgetLeft} minutes of unlock budget.`
                : 'Today’s unlock budget is used up.'}
          </Text>
        </Up>
      </View>

      <View style={{ gap: 10 }}>
        <PrimaryButton label={inbox ? 'Go to my messages' : `Back to ${site.name}`} onPress={inbox ? onInbox : onDismiss} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {inbox ? (
            <Pressable accessibilityRole="button" onPress={onDismiss} style={s.secondary}>
              <Text style={s.secondaryText}>Stay in {site.name}</Text>
            </Pressable>
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => router.back()} style={s.secondary}>
            <Text style={s.secondaryText}>Close app</Text>
          </Pressable>
        </View>
        {canUnlock ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              tap();
              gate.confirm(`Unlock ${feature} for ${UNLOCK_MIN} minutes?`, `Unlock ${UNLOCK_MIN} min`, () => {
                if (unlock()) onDismiss();
              });
            }}
            style={s.unlockLink}>
            <Text style={s.unlockText}>Spend {UNLOCK_MIN} min from budget to unlock</Text>
          </Pressable>
        ) : (
          <View style={{ height: 44 }} />
        )}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  strip: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 12 },
  home: {
    height: 32,
    paddingLeft: 8,
    paddingRight: 12,
    borderRadius: 16,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  homeText: { fontFamily: f.b600, fontSize: 13, color: c.text },
  status: { height: 28, paddingHorizontal: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  statusText: { fontFamily: f.b600, fontSize: 12, flexShrink: 1 },

  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },
  fallbackText: { fontFamily: f.b400, fontSize: 15, lineHeight: 22, color: c.soft, textAlign: 'center' },
  preview: { height: 44, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, justifyContent: 'center' },
  previewText: { fontFamily: f.b500, fontSize: 14, color: c.text },

  launch: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', gap: 8 },
  launchIcon: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  launchRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 75, borderWidth: 1, borderColor: c.accent },
  launchName: { fontFamily: f.h700, fontSize: 24, letterSpacing: -0.5, color: c.text },
  launchSub: { fontFamily: f.b400, fontSize: 14, color: c.muted },

  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.bg, paddingHorizontal: 24 },
  coverTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: { fontFamily: f.b500, fontSize: 13, color: c.text },
  by: { fontFamily: f.b400, fontSize: 13, color: c.muted },
  ringsWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rings: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderWidth: 1 },
  halo: { position: 'absolute', top: 62, left: 62, right: 62, bottom: 62, borderRadius: 68, backgroundColor: 'rgba(212,255,58,0.14)' },
  core: { width: 92, height: 92, borderRadius: 46, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontFamily: f.b600, fontSize: 13, color: c.accent, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontFamily: f.h700, fontSize: 36, lineHeight: 39, letterSpacing: -1.1, color: c.text },
  body: { fontFamily: f.b400, fontSize: 15, lineHeight: 22, color: c.soft },
  secondary: { flex: 1, height: 52, borderRadius: 26, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
  unlockLink: { height: 44, alignItems: 'center', justifyContent: 'center' },
  unlockText: { fontFamily: f.b500, fontSize: 13, color: c.muted, textDecorationLine: 'underline' },
  secondaryText: { fontFamily: f.b500, fontSize: 14, color: c.text },
});
