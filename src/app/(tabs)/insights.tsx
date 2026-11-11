import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, Up } from '../../components/ui';
import { SITES } from '../../data/sites';
import { dayAt, DayStat, fmtDuration, fmtHour, lastDays, riskiestHour, sum } from '../../data/stats';
import { grow } from '../../lib/anim';
import { useNow, useStore } from '../../lib/store';
import { c, f } from '../../theme';

const BAR_MAX = 84;

export default function Insights() {
  const insets = useSafeAreaInsets();
  const { answers, days } = useStore();
  const now = useNow(30000);
  if (!answers) return null;

  const today = dayAt(days, 0, now);
  const yesterday = dayAt(days, 1, now);
  const week = lastDays(days, 7, now);
  const prev = lastDays(days, 7, now, 7);
  const total = sum(week, (d) => d.dodges);
  const before = sum(prev, (d) => d.dodges);
  const max = Math.max(1, ...week.map((d) => d.stat.dodges));
  const risky = riskiestHour(week);
  const change = before > 0 ? Math.round(((total - before) / before) * 100) : null;

  const perSite = SITES.map((site) => ({ site, count: sum(week, (d) => d.bySite[site.id] ?? 0) }));
  const top = Math.max(1, ...perSite.map((p) => p.count));

  const rows: { label: string; pick: (d: DayStat) => string }[] = [
    { label: 'Feeds blocked', pick: (d) => String(d.dodges) },
    { label: 'Time in apps', pick: (d) => fmtDuration(d.seconds) },
    { label: 'Unlocks taken', pick: (d) => String(d.unlocks) },
    { label: 'Focus time', pick: (d) => `${d.focusMin}m` },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: Math.max(insets.top + 12, 44), paddingHorizontal: 20, paddingBottom: 8, gap: 16 }}
      showsVerticalScrollIndicator={false}>
      <Up style={s.rowBetween}>
        <Text style={s.h1}>Stats</Text>
        <View style={s.range}>
          <Text style={s.rangeText}>Last 7 days</Text>
        </View>
      </Up>

      {/* Chart */}
      <Up delay={60}>
        <Card style={{ gap: 14, paddingTop: 18, paddingBottom: 14 }}>
          <View style={{ gap: 2 }}>
            <Text style={s.label}>Feeds blocked</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <Text style={s.big}>{total}</Text>
              <Text style={s.delta}>
                {change === null ? 'First week of data' : `${change > 0 ? '+' : change < 0 ? '−' : ''}${Math.abs(change)}% vs the week before`}
              </Text>
            </View>
          </View>
          <View
            style={s.chart}
            accessibilityRole="image"
            accessibilityLabel={`Feeds blocked per day: ${week.map((d) => d.stat.dodges).join(', ')}`}>
            {week.map((d, i) => (
              <View key={d.key} style={s.col}>
                <Text style={s.colValue}>{d.stat.dodges}</Text>
                <Animated.View
                  style={[
                    {
                      width: '100%',
                      maxWidth: 30,
                      height: Math.max(8, Math.round((d.stat.dodges / max) * BAR_MAX)),
                      borderRadius: 8,
                      backgroundColor: d.isToday ? c.accent : c.ring,
                    },
                    grow(160 + i * 60),
                  ]}
                />
                <Text style={[s.colLabel, { color: d.isToday ? c.text : c.muted }]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </Up>

      {/* Today vs yesterday */}
      <Up delay={120}>
        <Card style={{ paddingVertical: 6 }}>
          <View style={[s.tr, s.trBorder]}>
            <Text style={[s.th, { flex: 1 }]}> </Text>
            <Text style={s.th}>Yesterday</Text>
            <Text style={s.th}>Today</Text>
          </View>
          {rows.map((r, i) => (
            <View key={r.label} style={[s.tr, i < rows.length - 1 && s.trBorder]}>
              <Text style={[s.td, { flex: 1 }]}>{r.label}</Text>
              <Text style={[s.num, { color: c.muted }]}>{r.pick(yesterday)}</Text>
              <Text style={s.num}>{r.pick(today)}</Text>
            </View>
          ))}
        </Card>
      </Up>

      {/* Stats */}
      <Up delay={180} style={{ flexDirection: 'row', gap: 10 }}>
        <Card style={s.stat}>
          <Text style={s.small}>Riskiest hour</Text>
          <Text style={s.statBig}>{risky === null ? '—' : fmtHour(risky)}</Text>
        </Card>
        <Card style={s.stat}>
          <Text style={s.small}>Time in apps, 7 days</Text>
          <Text style={s.statBig}>{fmtDuration(sum(week, (d) => d.seconds))}</Text>
        </Card>
      </Up>

      {/* Breakdown */}
      <Up delay={240}>
        <Card style={{ paddingVertical: 6 }}>
          {perSite.map((p, i) => (
            <View key={p.site.id} style={[{ gap: 8, paddingVertical: 12 }, i < perSite.length - 1 && s.trBorder]}>
              <View style={s.rowBetween}>
                <Text style={s.td}>{p.site.name}</Text>
                <Text style={s.label}>{p.count} blocks</Text>
              </View>
              <View style={s.track}>
                <Animated.View
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: c.accent,
                    width: `${Math.round((p.count / top) * 100)}%`,
                    transitionProperty: 'width',
                    transitionDuration: '600ms',
                  }}
                />
              </View>
            </View>
          ))}
        </Card>
      </Up>

      <Up delay={300}>
        <Text style={s.note}>
          {Object.keys(days).length === 0 ? 'Open an app from the Apps tab and the numbers start counting. ' : ''}
          Counted on this phone only. Nothing is uploaded.
        </Text>
      </Up>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: f.h600, fontSize: 28, letterSpacing: -0.5, color: c.text },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  range: { height: 36, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, justifyContent: 'center' },
  rangeText: { fontFamily: f.b500, fontSize: 13, color: c.text },
  label: { fontFamily: f.b400, fontSize: 13, color: c.muted },
  small: { fontFamily: f.b400, fontSize: 12, color: c.muted },
  big: { fontFamily: f.h700, fontSize: 34, letterSpacing: -1, color: c.text },
  delta: { fontFamily: f.b600, fontSize: 13, color: c.accent },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 128, gap: 8 },
  col: { flex: 1, alignItems: 'center', gap: 8 },
  colValue: { fontFamily: f.b400, fontSize: 11, color: c.muted },
  colLabel: { fontFamily: f.b500, fontSize: 12 },
  tr: { flexDirection: 'row', alignItems: 'center', minHeight: 46, gap: 8 },
  trBorder: { borderBottomWidth: 1, borderBottomColor: c.chip },
  th: { fontFamily: f.b400, fontSize: 12, color: c.muted, width: 78, textAlign: 'right' },
  td: { fontFamily: f.b500, fontSize: 14, color: c.text },
  num: { fontFamily: f.h600, fontSize: 16, color: c.text, width: 78, textAlign: 'right' },
  stat: { flex: 1, borderRadius: 20, padding: 14, gap: 4 },
  statBig: { fontFamily: f.h700, fontSize: 26, color: c.text },
  track: { height: 6, borderRadius: 3, backgroundColor: c.border, overflow: 'hidden' },
  note: { fontFamily: f.b400, fontSize: 12, color: c.muted, textAlign: 'center' },
});
