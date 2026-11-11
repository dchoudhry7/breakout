import { router } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTile } from '../../components/AppTile';
import { Avatar } from '../../components/Avatar';
import { Icon } from '../../components/Icons';
import { Ring } from '../../components/Ring';
import { Card, Up } from '../../components/ui';
import { blockState, describe, fmtWhen } from '../../data/schedule';
import { cutLabel, SITES } from '../../data/sites';
import { dayAt, lastDays, streak } from '../../data/stats';
import { grow } from '../../lib/anim';
import { tap } from '../../lib/haptics';
import { useCountUp, useNow, useStore } from '../../lib/store';
import { c, f } from '../../theme';

function greeting(now: Date) {
  const h = now.getHours();
  return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** What the app is doing for you right now: what's blocked, when, and how today is going. */
export default function Home() {
  const insets = useSafeAreaInsets();
  const { answers, photo, schedule, pauseUntil, focusUntil, on, apps, days, today, budgetLeft, settings, startedAt, resume } = useStore();
  const now = useNow(10000);
  const count = useCountUp(today.dodges, 800);
  if (!answers) return null;

  const { blocked, paused, focus, change } = blockState(schedule, { pauseUntil, focusUntil }, now);
  const mine = SITES.filter((x) => apps.includes(x.id));
  const yesterday = dayAt(days, 1, now);
  const week = lastDays(days, 7, now);
  const run = streak(days, startedAt, now);
  const minsLeft = change ? Math.max(1, Math.ceil((change.getTime() - now.getTime()) / 60000)) : 0;

  const title = paused ? 'Unlocked for a moment' : focus ? 'Focus session running' : blocked ? 'Blocking is on' : 'Blocking is off';
  const sub = paused
    ? `Back on in ${minsLeft} min`
    : focus
      ? `${minsLeft} min left · everything blocked`
      : blocked
        ? change
          ? `Until ${fmtWhen(change, now)}`
          : 'All day, every day'
        : change
          ? `Starts ${fmtWhen(change, now)}`
          : 'No block hours set';

  const diff = today.dodges - yesterday.dodges;
  const compare =
    yesterday.dodges === 0 && today.dodges === 0
      ? 'Nothing blocked yet'
      : `${yesterday.dodges} yesterday${diff === 0 ? '' : ` · ${diff > 0 ? '+' : '−'}${Math.abs(diff)}`}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ paddingTop: Math.max(insets.top + 12, 44), paddingHorizontal: 20, paddingBottom: 8, gap: 16 }}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Up style={s.header}>
        <View style={{ gap: 4, flex: 1 }}>
          <Text style={s.date}>{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
          <Text style={s.h1} numberOfLines={1}>
            {greeting(now)}
            {answers.name ? `, ${answers.name}` : ''}
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Profile and settings" hitSlop={8} onPress={() => router.push('/settings')}>
          <View style={s.avatarRing}>
            <Avatar photo={photo} name={answers.name} size={40} />
          </View>
          <View style={s.gear}>
            <Icon name="gear" size={11} color={c.text} width={2} />
          </View>
        </Pressable>
      </Up>

      {/* Hero: blocked today + unlock budget ring */}
      <Up delay={60}>
        <View style={s.hero}>
          <View style={{ gap: 6, flex: 1 }}>
            <Text style={s.heroKicker}>Blocked today</Text>
            <Text style={s.heroBig}>{count}</Text>
            <Text style={s.heroSub}>{compare}</Text>
          </View>
          <Ring
            size={112}
            stroke={10}
            value={settings.budgetMin ? budgetLeft / settings.budgetMin : 0}
            color={c.onAccent}
            track="rgba(10,10,12,0.15)"
            label={`Unlock budget: ${budgetLeft} of ${settings.budgetMin} minutes left`}>
            <Text style={s.ringBig}>{budgetLeft}m</Text>
            <Text style={s.ringSmall}>unlock left</Text>
          </Ring>
        </View>
      </Up>

      {/* Blocking status + schedule */}
      <Up delay={110}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${sub}. ${paused ? 'Block again' : 'Change block hours'}`}
          onPress={() => {
            tap();
            if (paused) resume();
            else router.push('/schedule');
          }}>
          <Card style={s.status}>
            <View style={[s.statusIcon, { backgroundColor: blocked ? c.accent : c.chip }]}>
              <Icon name={blocked ? 'lock' : 'unlock'} size={20} color={blocked ? c.onAccent : c.muted} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.rowTitle}>{title}</Text>
              <Text style={s.small}>{sub}</Text>
            </View>
            <Text style={s.link}>{paused ? 'Block again' : 'Hours'}</Text>
          </Card>
        </Pressable>
      </Up>

      {/* What's blocked */}
      <Up delay={160}>
        <Card style={{ paddingVertical: 6 }}>
          <View style={[s.rowBetween, { paddingTop: 10, paddingBottom: 6 }]}>
            <Text style={s.h2}>What’s blocked</Text>
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/features')}>
              <Text style={s.link}>Manage</Text>
            </Pressable>
          </View>
          {mine.length === 0 && <Text style={[s.small, { paddingVertical: 12 }]}>No apps added yet. Tap Manage to add one.</Text>}
          {mine.map((site, i) => {
            const label = cutLabel(site, on);
            return (
              <View key={site.id} style={[s.item, i < mine.length - 1 && s.itemBorder]}>
                <AppTile id={site.id} size={32} />
                <Text style={s.itemName}>{site.name}</Text>
                <Text style={[s.itemValue, { color: label ? c.text : c.muted }]} numberOfLines={1}>
                  {label || 'Nothing'}
                </Text>
                <View style={[s.dot, { backgroundColor: label && blocked ? c.accent : c.ring }]} />
              </View>
            );
          })}
          <Text style={[s.small, { paddingVertical: 10 }]}>Block hours: {describe(schedule)}</Text>
        </Card>
      </Up>

      {/* Streak */}
      <Up delay={210}>
        <Card style={s.streak}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.rowTitle}>{run === 1 ? '1-day streak' : `${run}-day streak`}</Text>
            <Text style={s.small}>Days in a row without unlocking</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {week.map((d, i) => {
              const counted = !!startedAt && d.key >= startedAt.slice(0, 10) && d.stat.unlocks === 0;
              return (
                <Animated.View
                  key={d.key}
                  style={[{ width: 10, height: 26, borderRadius: 5, backgroundColor: counted ? c.accent : c.border }, grow(300 + i * 50)]}
                />
              );
            })}
          </View>
        </Card>
      </Up>

      {/* Focus */}
      <Up delay={260}>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            tap();
            router.push('/focus');
          }}
          style={({ pressed }) => [s.cta, { transform: [{ scale: pressed ? 0.98 : 1 }] }]}>
          <Icon name="target" size={20} color={c.onAccent} />
          <Text style={s.ctaText}>{focus ? 'Focus session running' : 'Start a focus session'}</Text>
        </Pressable>
      </Up>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  date: { fontFamily: f.b400, fontSize: 13, color: c.muted },
  h1: { fontFamily: f.h600, fontSize: 28, letterSpacing: -0.5, color: c.text },
  h2: { fontFamily: f.h600, fontSize: 17, color: c.text },
  link: { fontFamily: f.b500, fontSize: 14, color: c.accent },
  small: { fontFamily: f.b400, fontSize: 12, color: c.muted },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontFamily: f.b600, fontSize: 15, color: c.text },
  gear: { position: 'absolute', right: -3, bottom: -3, width: 20, height: 20, borderRadius: 10, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  avatarRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },

  hero: { backgroundColor: c.accent, borderRadius: 28, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroKicker: { fontFamily: f.b600, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, color: c.onAccent },
  heroBig: { fontFamily: f.h700, fontSize: 60, lineHeight: 62, letterSpacing: -2.5, color: c.onAccent },
  heroSub: { fontFamily: f.b500, fontSize: 13, color: c.onAccent },
  ringBig: { fontFamily: f.h700, fontSize: 22, color: c.onAccent },
  ringSmall: { fontFamily: f.b600, fontSize: 11, color: c.onAccent },

  status: { borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  statusIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  item: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: c.chip },
  itemName: { fontFamily: f.b500, fontSize: 15, color: c.text, width: 92 },
  itemValue: { flex: 1, fontFamily: f.b400, fontSize: 13, textAlign: 'right' },
  dot: { width: 8, height: 8, borderRadius: 4 },

  streak: { borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },

  cta: { height: 58, borderRadius: 29, backgroundColor: c.text, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaText: { fontFamily: f.b600, fontSize: 16, color: c.onAccent },
});
