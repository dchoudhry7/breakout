import { router } from 'expo-router';
import React, { useRef } from 'react';
import { Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTile } from '../../components/AppTile';
import { Icon } from '../../components/Icons';
import { useGate } from '../../components/UnblockGate';
import { Card, Up } from '../../components/ui';
import { blockState } from '../../data/schedule';
import { activeFeatures, cutLabel, featureKey, SITES, totalActive } from '../../data/sites';
import type { Site } from '../../data/sites';
import { ease, pop, pulse } from '../../lib/anim';
import { tap } from '../../lib/haptics';
import { useCountUp, useNow, useStore } from '../../lib/store';
import { c, f } from '../../theme';

/** A feature you can switch on or off right from the card. Lime means it is blocked. */
function Chip({ label, app, value, onPress }: { label: string; app: string; value: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={`Block ${label} in ${app}`}
      accessibilityState={{ checked: value }}
      hitSlop={4}
      onPress={() => {
        tap();
        onPress();
      }}>
      <Animated.View
        style={[
          s.chip,
          { backgroundColor: value ? c.accent : c.chip, transitionProperty: 'backgroundColor', transitionDuration: '200ms' },
        ]}>
        {value && <Icon name="lock" size={11} color={c.onAccent} width={2.6} />}
        <Text style={[s.chipText, { color: value ? c.onAccent : c.muted }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** One of your apps: open it, see what is blocked, and flip controls in place. */
function AppCard({
  site,
  index,
  on,
  blocked,
  toggle,
}: {
  site: Site;
  index: number;
  on: string[];
  blocked: boolean;
  toggle: (key: string) => void;
}) {
  const n = activeFeatures(site, on).length;
  const total = site.features.length;
  const label = cutLabel(site, on);

  return (
    <Animated.View layout={LinearTransition.duration(320)} style={s.cell}>
      <Animated.View style={[s.card, pop(80 + index * 70, 450, 0.7, 1.04)]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${site.name}`}
          onPress={() => {
            tap();
            router.push({ pathname: '/browse/[id]', params: { id: site.id } });
          }}
          style={({ pressed }) => [{ gap: 12, transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
          <View style={s.cardTop}>
            <AppTile id={site.id} size={48} />
            <View style={s.go}>
              <Icon name="arrowRight" size={15} color={c.text} />
            </View>
          </View>
          <View style={{ gap: 2 }}>
            <Text style={s.name} numberOfLines={1}>
              {site.name}
            </Text>
            <Text style={s.small} numberOfLines={1}>
              {label ? `Blocking ${label}` : 'Nothing blocked'}
            </Text>
          </View>
        </Pressable>

        <View style={s.chips}>
          {site.features.map((feat) => {
            const key = featureKey(site, feat);
            return <Chip key={key} label={feat.label} app={site.name} value={on.includes(key)} onPress={() => toggle(key)} />;
          })}
        </View>

        <View style={s.meter}>
          <View style={s.track}>
            <Animated.View
              style={[
                s.fill,
                {
                  width: `${Math.round((n / total) * 100)}%`,
                  backgroundColor: blocked ? c.accent : c.muted,
                  transitionProperty: 'width',
                  transitionDuration: '450ms',
                  transitionTimingFunction: ease,
                },
              ]}
            />
          </View>
          <Text style={s.count}>
            {n}/{total}
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

/** Your apps, what is blocked inside each, and a place to add more, all on one page. */
export default function Apps() {
  const insets = useSafeAreaInsets();
  const { answers, apps, on, schedule, pauseUntil, focusUntil, today, toggleFeature, addApp } = useStore();
  const now = useNow(10000);
  const dodged = useCountUp(today.dodges, 800);
  const scroller = useRef<ScrollViewInstance>(null);
  const addY = useRef(0);
  const gate = useGate();
  if (!answers) return null;

  const { blocked } = blockState(schedule, { pauseUntil, focusUntil }, now);
  // Switching a block ON is instant. Switching one OFF while blocking is active costs a wait.
  const toggle = (key: string) => {
    if (blocked && on.includes(key)) {
      gate.confirm('Turn this block off?', 'Turn it off', () => toggleFeature(key));
    } else toggleFeature(key);
  };
  const mine = SITES.filter((x) => apps.includes(x.id));
  const others = SITES.filter((x) => !apps.includes(x.id));
  const active = totalActive(on, apps);

  const goAdd = () => {
    tap();
    if (others.length === 0) router.push('/features');
    else scroller.current?.scrollTo({ y: Math.max(0, addY.current - 12), animated: true });
  };

  return (
    <ScrollView
      ref={scroller}
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: Math.max(insets.top + 12, 44), paddingHorizontal: 20, paddingBottom: 8, gap: 16 }}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Up style={s.header}>
        <View style={{ gap: 4, flex: 1 }}>
          <Text style={s.h1}>Apps</Text>
          <Text style={s.small}>
            {mine.length} {mine.length === 1 ? 'app' : 'apps'} added · {active} {active === 1 ? 'control' : 'controls'} on
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Add an app" hitSlop={6} onPress={goAdd} style={s.plus}>
          <Icon name="plus" size={20} color={c.onAccent} width={2.4} />
        </Pressable>
      </Up>

      {/* Status strip */}
      <Up delay={60}>
        <Card style={s.strip}>
          <View style={s.stripIcon}>
            {blocked && <Animated.View pointerEvents="none" style={[s.halo, pulse(0, 0.2)]} />}
            <View style={[s.disc, { backgroundColor: blocked ? c.accent : c.chip }]}>
              <Icon name={blocked ? 'lock' : 'unlock'} size={20} color={blocked ? c.onAccent : c.muted} />
            </View>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.rowTitle}>{blocked ? 'Blocking is on' : 'Blocking is off'}</Text>
            <Text style={s.small}>{blocked ? 'Your switched-on controls are active' : 'Controls wait for your block hours'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.big}>{dodged}</Text>
            <Text style={s.small}>blocked today</Text>
          </View>
        </Card>
      </Up>

      {/* Your apps */}
      <Up delay={110} style={s.sectionRow}>
        <Text style={s.section}>Your apps</Text>
        <Text style={s.small}>Tap a control to block it</Text>
      </Up>

      <View style={s.grid}>
        {mine.map((site, i) => (
          <AppCard key={site.id} site={site} index={i} on={on} blocked={blocked} toggle={toggle} />
        ))}
        {others.length > 0 && (
          <Animated.View layout={LinearTransition.duration(320)} style={s.cell}>
            <Animated.View style={pop(80 + mine.length * 70, 450, 0.7, 1.04)}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add an app"
                onPress={goAdd}
                style={({ pressed }) => [s.addTile, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
                <View style={s.addIcon}>
                  <Icon name="plus" size={22} color={c.muted} />
                </View>
                <Text style={[s.name, { color: c.muted }]}>Add app</Text>
                <Text style={s.small}>{others.length} more to pick from</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      {/* Add more apps */}
      <View onLayout={(e) => (addY.current = e.nativeEvent.layout.y)}>
        <Up delay={160 + mine.length * 40} style={{ gap: 8 }}>
          <View style={s.sectionRow}>
            <Text style={s.section}>Add more apps</Text>
            <Text style={s.small}>Feeds are blocked right away</Text>
          </View>
          {others.length > 0 ? (
            <Card style={{ paddingVertical: 2 }}>
              {others.map((site, i) => (
                <Animated.View key={site.id} layout={LinearTransition.duration(320)} exiting={FadeOut.duration(180)}>
                  <View style={[s.addRow, i < others.length - 1 && s.border]}>
                    <AppTile id={site.id} size={40} />
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={s.name}>{site.name}</Text>
                      <Text style={s.small} numberOfLines={1}>
                        Can block {site.features.map((x) => x.label).join(', ')}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${site.name}`}
                      hitSlop={8}
                      onPress={() => {
                        tap();
                        addApp(site.id);
                      }}
                      style={s.add}>
                      <Icon name="plus" size={14} color={c.onAccent} width={2.6} />
                      <Text style={s.addText}>Add</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              ))}
            </Card>
          ) : (
            <Card style={s.done}>
              <View style={[s.disc, { backgroundColor: c.accent }]}>
                <Icon name="check" size={20} color={c.onAccent} width={2.6} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.rowTitle}>Every supported app is added</Text>
                <Text style={s.small}>More are on the way.</Text>
              </View>
            </Card>
          )}
        </Up>
      </View>

      {/* Manage */}
      <Up delay={220 + mine.length * 40} style={{ gap: 12 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            tap();
            router.push('/features');
          }}
          style={({ pressed }) => [s.manage, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
          <Icon name="sliders" size={18} color={c.text} />
          <Text style={s.manageText}>Manage all controls</Text>
        </Pressable>
        <Text style={s.note}>
          A switched-on control is blocked during your block hours and focus sessions. Remove an app from Manage.
        </Text>
      </Up>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  h1: { fontFamily: f.h600, fontSize: 28, letterSpacing: -0.5, color: c.text },
  small: { fontFamily: f.b400, fontSize: 12, color: c.muted },
  plus: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },

  strip: { borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  stripIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: c.accent },
  disc: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: f.b600, fontSize: 15, color: c.text },
  big: { fontFamily: f.h700, fontSize: 30, lineHeight: 32, letterSpacing: -1, color: c.accent },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  section: { fontFamily: f.b600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, color: c.muted },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  cell: { width: '48.5%' },
  card: {
    flex: 1,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 24,
    padding: 14,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  go: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.chip, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: f.b600, fontSize: 16, color: c.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 30, paddingHorizontal: 11, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipText: { fontFamily: f.b500, fontSize: 12 },
  meter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 'auto' },
  track: { flex: 1, height: 5, borderRadius: 3, backgroundColor: c.track, overflow: 'hidden' },
  fill: { height: 5, borderRadius: 3 },
  count: { fontFamily: f.b600, fontSize: 12, color: c.muted },

  addTile: {
    minHeight: 188,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: c.ring,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
  },
  addIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: c.ring, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 },
  border: { borderBottomWidth: 1, borderBottomColor: c.chip },
  add: { height: 32, paddingLeft: 10, paddingRight: 12, borderRadius: 16, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontFamily: f.b600, fontSize: 13, color: c.onAccent },
  done: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 20 },

  manage: { height: 52, borderRadius: 26, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  manageText: { fontFamily: f.b600, fontSize: 15, color: c.text },
  note: { fontFamily: f.b400, fontSize: 12, lineHeight: 18, color: c.muted, paddingHorizontal: 4, paddingBottom: 4 },
});
