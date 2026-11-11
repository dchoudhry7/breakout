import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DAY_LETTERS, fmtTime, Schedule } from '../data/schedule';
import { c, f } from '../theme';
import { Icon } from './Icons';
import { Card, tap } from './ui';

const STEP = 30;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const wrap = (m: number) => ((m % 1440) + 1440) % 1440;

function TimeRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <View style={s.stepper}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} earlier`}
          hitSlop={6}
          style={s.stepBtn}
          onPress={() => {
            tap();
            onChange(wrap(value - STEP));
          }}>
          <Icon name="minus" size={18} color={c.text} />
        </Pressable>
        <Text style={s.time}>{fmtTime(value)}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label} later`}
          hitSlop={6}
          style={s.stepBtn}
          onPress={() => {
            tap();
            onChange(wrap(value + STEP));
          }}>
          <Icon name="plus" size={18} color={c.text} />
        </Pressable>
      </View>
    </View>
  );
}

/** Start time, end time and days for a custom block window. */
export function ScheduleEditor({ value, onChange }: { value: Schedule; onChange: (s: Schedule) => void }) {
  const toggleDay = (d: number) => {
    const has = value.days.includes(d);
    if (has && value.days.length === 1) return;
    tap();
    onChange({ ...value, days: has ? value.days.filter((x) => x !== d) : [...value.days, d] });
  };
  return (
    <Card style={{ gap: 14 }}>
      <TimeRow label="Block from" value={value.start} onChange={(start) => onChange({ ...value, start })} />
      <View style={s.divider} />
      <TimeRow label="Until" value={value.end} onChange={(end) => onChange({ ...value, end })} />
      <View style={s.divider} />
      <View style={{ gap: 10 }}>
        <Text style={s.rowLabel}>On these days</Text>
        <View style={s.days}>
          {DAY_LETTERS.map((letter, d) => {
            const on = value.days.includes(d);
            return (
              <Pressable
                key={d}
                accessibilityRole="checkbox"
                accessibilityLabel={DAY_NAMES[d]}
                accessibilityState={{ checked: on }}
                onPress={() => toggleDay(d)}
                style={[s.day, { backgroundColor: on ? c.accent : c.chip }]}>
                <Text style={[s.dayText, { color: on ? c.onAccent : c.muted }]}>{letter}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      {value.start > value.end && <Text style={s.note}>Runs overnight into the next morning.</Text>}
      {value.start === value.end && <Text style={s.note}>Same start and end means the whole day.</Text>}
    </Card>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontFamily: f.b400, fontSize: 15, color: c.text },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.chip, alignItems: 'center', justifyContent: 'center' },
  time: { fontFamily: f.h700, fontSize: 20, color: c.text, width: 68, textAlign: 'center' },
  divider: { height: 1, backgroundColor: c.chip },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { width: 40, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontFamily: f.b700, fontSize: 13 },
  note: { fontFamily: f.b400, fontSize: 12, color: c.muted },
});
