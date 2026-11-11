import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../components/Icons';
import { Ring } from '../components/Ring';
import { useGate } from '../components/UnblockGate';
import { Card, PrimaryButton, RoundButton, Toggle, Up } from '../components/ui';
import { describe, fmtTime, isBlocked, MODE_NAME } from '../data/schedule';
import { totalActive } from '../data/sites';
import { tap } from '../lib/haptics';
import { useNow, useStore } from '../lib/store';
import { c, f } from '../theme';

const MODES = [
  { id: 'deep', label: 'Deep work', minutes: 50 },
  { id: 'study', label: 'Study', minutes: 25 },
  { id: 'quick', label: 'Quick', minutes: 10 },
];

const clock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

export default function Focus() {
  const insets = useSafeAreaInsets();
  const { answers, schedule, on, apps, settings, setSetting, focusUntil, focusStart, startFocus, endFocus } = useStore();
  const gate = useGate();
  const [mode, setMode] = useState('deep');
  const now = useNow(1000);
  if (!answers) return null;

  const active = !!focusUntil && !!focusStart && Date.now() < focusUntil;
  const selected = MODES.find((m) => m.id === mode) ?? MODES[0];
  const totalMs = active ? focusUntil - focusStart : selected.minutes * 60000;
  // `now` ticks once a second and can be slightly older than the start time,
  // so never show more than the full session length.
  const leftMs = active ? Math.min(totalMs, focusUntil - now.getTime()) : totalMs;
  const scheduleOn = isBlocked(schedule, now);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: Math.max(insets.top + 12, 44), paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom + 16, 28), gap: 18 }}
      showsVerticalScrollIndicator={false}>
      <Up style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <RoundButton label="Back" onPress={() => router.back()}>
          <Icon name="chevronLeft" size={20} color={c.text} />
        </RoundButton>
        <Text style={s.h1}>Focus</Text>
      </Up>

      {/* Length */}
      <Up delay={50} style={{ flexDirection: 'row', gap: 8 }}>
        {MODES.map((m) => {
          const on = m.id === mode;
          return (
            <Pressable
              key={m.id}
              accessibilityRole="radio"
              accessibilityState={{ checked: on, disabled: active }}
              disabled={active}
              onPress={() => {
                tap();
                setMode(m.id);
              }}
              style={[s.chip, { backgroundColor: on ? c.text : c.card, borderColor: on ? c.text : c.border, opacity: active && !on ? 0.4 : 1 }]}>
              <Text style={[s.chipText, { color: on ? c.onAccent : c.text }]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </Up>

      {/* Timer */}
      <Up delay={100} style={{ alignItems: 'center', paddingVertical: 6 }}>
        <Ring
          size={240}
          stroke={14}
          value={active ? leftMs / totalMs : 1}
          color={c.accent}
          track={c.track}
          label={`${selected.label} session, ${clock(leftMs)} ${active ? 'remaining' : 'long'}`}>
          <Text style={s.time}>{clock(leftMs)}</Text>
          <Text style={s.hint}>
            {active ? `of ${Math.round(totalMs / 60000)} min · all feeds blocked` : `${selected.minutes} min · all feeds blocked`}
          </Text>
        </Ring>
      </Up>

      <Up delay={150}>
        {!active ? (
          <PrimaryButton label={`Start ${selected.minutes}-minute session`} onPress={() => startFocus(selected.minutes)} />
        ) : settings.strict ? (
          <View style={s.locked}>
            <Icon name="lock" size={18} color={c.muted} />
            <Text style={s.lockedText}>Strict mode is on. This session runs to the end.</Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              tap();
              gate.confirm('End this focus session early?', 'End session', endFocus);
            }}
            style={s.endBtn}>
            <Text style={s.endText}>End session early</Text>
          </Pressable>
        )}
      </Up>

      {/* Strict mode */}
      <Up delay={200}>
        <Card style={s.strict}>
          <Icon name="lock" size={22} color={c.text} width={1.8} />
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={s.rowTitle}>Strict mode</Text>
            <Text style={s.small}>No unlocks or early exit until a session ends</Text>
          </View>
          {active && settings.strict ? (
            <Text style={s.small}>Locked</Text>
          ) : (
            <Toggle label="Strict mode" value={settings.strict} onChange={(v) => setSetting('strict', v)} />
          )}
        </Card>
      </Up>

      {/* Schedule */}
      <View style={{ gap: 10 }}>
        <Up delay={250} style={s.rowBetween}>
          <Text style={s.h2}>Schedule</Text>
          <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/schedule')}>
            <Text style={s.link}>Edit</Text>
          </Pressable>
        </Up>
        <Up delay={290}>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit schedule" onPress={() => router.push('/schedule')}>
            <Card style={s.sched}>
              <Text style={s.schedTime}>
                {schedule.mode === 'always' || schedule.start === schedule.end
                  ? 'All day'
                  : `${fmtTime(schedule.start)}–${fmtTime(schedule.end)}`}
              </Text>
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={s.schedName}>{MODE_NAME[schedule.mode]}</Text>
                <Text style={s.small} numberOfLines={1}>
                  {describe(schedule).split(', ').slice(-1)[0]} · {totalActive(on, apps)} blocks
                </Text>
              </View>
              <View style={[s.pill, { backgroundColor: scheduleOn ? c.accent : c.border }]}>
                <Text style={[s.pillText, { color: scheduleOn ? c.onAccent : c.text }]}>{scheduleOn ? 'On' : 'Later'}</Text>
              </View>
            </Card>
          </Pressable>
        </Up>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: f.h600, fontSize: 28, letterSpacing: -0.5, color: c.text },
  h2: { fontFamily: f.h600, fontSize: 18, color: c.text },
  link: { fontFamily: f.b500, fontSize: 14, color: c.accent },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, justifyContent: 'center' },
  chipText: { fontFamily: f.b600, fontSize: 14 },
  time: { fontFamily: f.h700, fontSize: 56, lineHeight: 60, letterSpacing: -2, color: c.text },
  hint: { fontFamily: f.b400, fontSize: 13, color: c.muted },
  endBtn: { height: 58, borderRadius: 29, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' },
  endText: { fontFamily: f.b600, fontSize: 16, color: c.text },
  locked: { height: 58, borderRadius: 29, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  lockedText: { fontFamily: f.b500, fontSize: 13, color: c.muted },
  strict: { borderRadius: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowTitle: { fontFamily: f.b600, fontSize: 15, color: c.text },
  small: { fontFamily: f.b400, fontSize: 12, color: c.muted },
  sched: { borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 66 },
  schedTime: { fontFamily: f.h600, fontSize: 15, color: c.text, width: 92 },
  schedName: { fontFamily: f.b500, fontSize: 14, color: c.text },
  pill: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 10 },
  pillText: { fontFamily: f.b600, fontSize: 12 },
});
