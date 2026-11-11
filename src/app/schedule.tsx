import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OptionRow } from '../components/OptionRow';
import { ScheduleEditor } from '../components/ScheduleEditor';
import { Icon } from '../components/Icons';
import { useGate } from '../components/UnblockGate';
import { RoundButton, tap, Up } from '../components/ui';
import { STEPS } from '../data/quiz';
import { blockState, describe, PRESETS, Schedule, ScheduleMode } from '../data/schedule';
import { useNow, useStore } from '../lib/store';
import { c, f } from '../theme';

// Reuse the plan options (icon, label, description) from the quiz so both stay in sync.
const planStep = STEPS.find((x) => x.kind === 'question' && x.id === 'plan');
const OPTIONS = planStep && planStep.kind === 'question' ? planStep.options : [];

export default function ScheduleTab() {
  const insets = useSafeAreaInsets();
  const { answers, schedule, setSchedule, pauseUntil, focusUntil } = useStore();
  const now = useNow();
  const gate = useGate();
  // Once the wait is paid, edits stay open until you leave this screen.
  const [open, setOpen] = useState(false);
  if (!answers) return null;
  const { blocked } = blockState(schedule, { pauseUntil, focusUntil }, now);

  // Changing hours while blocking is active could switch it off, so it costs a wait first.
  const change = (next: Schedule) => {
    if (!blocked || open) setSchedule(next);
    else
      gate.confirm('Change your block hours?', 'Change hours', () => {
        setOpen(true);
        setSchedule(next);
      });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: Math.max(insets.top + 12, 44), paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom + 16, 28), gap: 16 }}
      showsVerticalScrollIndicator={false}>
      <Up style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <RoundButton label="Back" onPress={() => router.back()}>
          <Icon name="chevronLeft" size={20} color={c.text} />
        </RoundButton>
        <Text style={s.h1}>Schedule</Text>
      </Up>
      <Up delay={40}>
        <Text style={s.sub}>Choose when Reels and Shorts are blocked.</Text>
      </Up>

      <View style={{ gap: 10 }}>
        {OPTIONS.map((o, j) => (
          <Up key={o.id} delay={80 + j * 60}>
            <OptionRow
              icon={o.icon}
              label={o.label}
              desc={o.desc}
              selected={schedule.mode === o.id}
              onPress={() => {
                if (schedule.mode === o.id) return;
                tap();
                change(PRESETS[o.id as ScheduleMode]);
              }}
            />
          </Up>
        ))}
      </View>

      {schedule.mode === 'custom' && (
        <Up>
          <ScheduleEditor value={schedule} onChange={change} />
        </Up>
      )}

      <Up delay={340}>
        <View style={s.status}>
          <View style={[s.dot, { backgroundColor: blocked ? c.accent : c.ring }]} />
          <Text style={s.statusText}>
            {describe(schedule)}. {blocked ? 'Blocking is on now.' : 'Blocking is off now.'}
          </Text>
        </View>
      </Up>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: f.h600, fontSize: 28, letterSpacing: -0.5, color: c.text },
  sub: { fontFamily: f.b400, fontSize: 15, color: c.muted },
  status: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { flex: 1, fontFamily: f.b400, fontSize: 13, lineHeight: 19, color: c.muted },
});
