import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTile } from '../components/AppTile';
import { Icon } from '../components/Icons';
import { useGate } from '../components/UnblockGate';
import { Card, RoundButton, Toggle, Up } from '../components/ui';
import { blockState } from '../data/schedule';
import { activeFeatures, featureKey, SITES, totalActive } from '../data/sites';
import { tap } from '../lib/haptics';
import { useNow, useStore } from '../lib/store';
import { c, f } from '../theme';

/** Choose which apps you use here, and what is blocked inside each one. */
export default function Features() {
  const insets = useSafeAreaInsets();
  const { answers, apps, on, schedule, pauseUntil, focusUntil, toggleFeature, addApp, removeApp } = useStore();
  const now = useNow(10000);
  const gate = useGate();
  if (!answers) return null;

  const { blocked } = blockState(schedule, { pauseUntil, focusUntil }, now);
  // Turning blocks off (or removing an app) while blocking is active costs a wait. Turning on is instant.
  const toggle = (key: string) => {
    if (blocked && on.includes(key)) gate.confirm('Turn this block off?', 'Turn it off', () => toggleFeature(key));
    else toggleFeature(key);
  };
  const remove = (id: string, name: string) => {
    if (blocked) gate.confirm(`Remove ${name} and its blocks?`, 'Remove app', () => removeApp(id));
    else removeApp(id);
  };

  const mine = SITES.filter((x) => apps.includes(x.id));
  const others = SITES.filter((x) => !apps.includes(x.id));
  const count = totalActive(on, apps);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top + 12, 44),
        paddingHorizontal: 20,
        paddingBottom: Math.max(insets.bottom + 16, 28),
        gap: 16,
      }}
      showsVerticalScrollIndicator={false}>
      <Up style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <RoundButton label="Back" onPress={() => router.back()}>
          <Icon name="chevronLeft" size={20} color={c.text} />
        </RoundButton>
        <Text style={s.h1}>Apps & controls</Text>
      </Up>
      <Up delay={30}>
        <Text style={s.sub}>
          {mine.length} {mine.length === 1 ? 'app' : 'apps'} added · {count} {count === 1 ? 'thing' : 'things'} blocked
        </Text>
      </Up>

      {mine.map((site, j) => {
        const n = activeFeatures(site, on).length;
        return (
          <Up key={site.id} delay={60 + j * 60}>
            <Card style={s.section}>
              <View style={s.head}>
                <AppTile id={site.id} size={36} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text style={s.name}>{site.name}</Text>
                  <Text style={s.small}>
                    {n} of {site.features.length} blocked
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${site.name}`}
                  hitSlop={8}
                  onPress={() => {
                    tap();
                    remove(site.id, site.name);
                  }}
                  style={s.remove}>
                  <Text style={s.removeText}>Remove</Text>
                </Pressable>
              </View>
              {site.features.map((feat) => {
                const key = featureKey(site, feat);
                return (
                  <View key={key} style={s.row}>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text style={s.label}>{feat.label}</Text>
                      <Text style={s.small}>{feat.hint}</Text>
                    </View>
                    <Toggle label={`Block ${feat.label} in ${site.name}`} value={on.includes(key)} onChange={() => toggle(key)} />
                  </View>
                );
              })}
            </Card>
          </Up>
        );
      })}

      {others.length > 0 && (
        <Up delay={60 + mine.length * 60}>
          <View style={{ gap: 8 }}>
            <Text style={s.sectionTitle}>Add an app</Text>
            <Card style={{ paddingVertical: 2 }}>
              {others.map((site, i) => (
                <View key={site.id} style={[s.addRow, i < others.length - 1 && s.border]}>
                  <AppTile id={site.id} size={36} />
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
              ))}
            </Card>
          </View>
        </Up>
      )}

      <Up delay={120 + SITES.length * 60}>
        <Text style={s.note}>
          A switched-on control is blocked during your block hours and focus sessions. Only things with their own page can
          be blocked, so calls aren’t listed: these apps don’t offer them here.
        </Text>
      </Up>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: f.h600, fontSize: 28, letterSpacing: -0.5, color: c.text },
  sub: { fontFamily: f.b400, fontSize: 13, color: c.muted },
  sectionTitle: { fontFamily: f.b600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, color: c.muted, paddingHorizontal: 4 },
  section: { paddingVertical: 6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.chip },
  name: { fontFamily: f.b600, fontSize: 16, color: c.text },
  small: { fontFamily: f.b400, fontSize: 12, color: c.muted },
  remove: { height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: c.chip, justifyContent: 'center' },
  removeText: { fontFamily: f.b500, fontSize: 13, color: c.danger },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  label: { fontFamily: f.b500, fontSize: 15, color: c.text },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 62 },
  border: { borderBottomWidth: 1, borderBottomColor: c.chip },
  add: { height: 32, paddingLeft: 10, paddingRight: 12, borderRadius: 16, backgroundColor: c.accent, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontFamily: f.b600, fontSize: 13, color: c.onAccent },
  note: { fontFamily: f.b400, fontSize: 12, lineHeight: 18, color: c.muted, paddingHorizontal: 4 },
});
