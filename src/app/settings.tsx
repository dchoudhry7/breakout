import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '../components/Avatar';
import { Icon, IconName } from '../components/Icons';
import { Card, RoundButton, Toggle, Up } from '../components/ui';
import { daysBack, goalName } from '../data/plan';
import { EXTRA_LABEL } from '../data/quiz';
import { useGate } from '../components/UnblockGate';
import { blockState, describe } from '../data/schedule';
import { totalActive } from '../data/sites';
import { fmtDuration, streak } from '../data/stats';
import { DIFFICULTIES, DIFFICULTY_LABEL, ladderText } from '../lib/friction';
import { tap } from '../lib/haptics';
import { UNLOCK_MIN, useNow, useStore } from '../lib/store';
import { APP_NAME, c, f } from '../theme';

const BUDGETS = [0, 5, 15, 30];

function confirm(title: string, message: string, action: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onYes();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: action, style: 'destructive', onPress: onYes },
  ]);
}

export default function Settings() {
  const insets = useSafeAreaInsets();
  const { answers, photo, setPhoto, startedAt, schedule, on, apps, settings, setSetting, setName, days, clearStats, reset, pauseUntil, focusUntil } = useStore();
  const gate = useGate();
  const now = useNow(15000);
  if (!answers) return null;

  const { blocked } = blockState(schedule, { pauseUntil, focusUntil }, now);
  // Anything that makes blocking easier to escape goes through the wait. Making it stricter is instant.
  const eased = (title: string, action: string, run: () => void, isEasier: boolean) =>
    isEasier ? gate.confirm(title, action, run) : run();

  const all = Object.values(days);
  const totalBlocked = all.reduce((n, d) => n + d.dodges, 0);
  const totalFocus = all.reduce((n, d) => n + d.focusMin, 0);
  const totalSeconds = all.reduce((n, d) => n + d.seconds, 0);
  const daysOn = startedAt ? Math.max(1, Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000) + 1) : 1;
  const since = startedAt ? new Date(startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const extras = answers.extra.map((x) => EXTRA_LABEL[x]).filter(Boolean);

  // The photo is shrunk and stored on the phone with everything else; it is never uploaded.
  const pickPhoto = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });
      const asset = res.canceled ? null : res.assets[0];
      if (asset?.base64) setPhoto(`data:${asset.mimeType ?? 'image/jpeg'};base64,${asset.base64}`);
    } catch {
      Alert.alert('Couldn’t open your photos', 'Check photo access for this app in Settings and try again.');
    }
  };

  // Tapping the photo: pick one if there is none, otherwise offer to replace or remove it.
  const photoMenu = () => {
    tap();
    if (!photo || Platform.OS === 'web') {
      pickPhoto();
      return;
    }
    Alert.alert('Profile photo', undefined, [
      { text: 'Choose a new photo', onPress: pickPhoto },
      { text: 'Remove photo', style: 'destructive', onPress: () => setPhoto(null) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const changeName = () => {
    const save = (value?: string) => {
      const name = (value ?? '').trim().slice(0, 20);
      if (name) setName(name);
    };
    if (Platform.OS === 'web') {
      save(window.prompt('Your name', answers.name) ?? undefined);
      return;
    }
    Alert.prompt('Your name', 'Shown on your home screen and profile.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Save', onPress: save },
    ], 'plain-text', answers.name);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top + 12, 44),
        paddingHorizontal: 20,
        paddingBottom: Math.max(insets.bottom + 16, 28),
        gap: 16,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <Up style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <RoundButton label="Back" onPress={() => router.back()}>
          <Icon name="chevronLeft" size={20} color={c.text} />
        </RoundButton>
        <Text style={s.h1}>Profile</Text>
      </Up>

      {/* Profile card */}
      <Up delay={50}>
        <View style={s.profile}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={photo ? 'Profile photo. Change or remove' : 'Add a profile photo'}
              onPress={photoMenu}>
              <Avatar photo={photo} name={answers.name} size={64} bg={c.onAccent} fg={c.accent} />
            </Pressable>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={s.name} numberOfLines={1}>
                {answers.name}
              </Text>
              <Text style={s.profileSub}>
                {goalName(answers)} plan · since {since}
              </Text>
            </View>
          </View>
          <View style={s.divider} />
          <View style={{ flexDirection: 'row' }}>
            <Stat value={String(daysOn)} label={daysOn === 1 ? 'day on plan' : 'days on plan'} />
            <Stat value={String(streak(days, startedAt))} label="day streak" />
            <Stat value={String(totalBlocked)} label="feeds blocked" />
          </View>
        </View>
      </Up>

      {/* Goal */}
      <Up delay={100}>
        <Section title="You">
          <Row icon="user" label="Name" value={answers.name} onPress={changeName} />
          <Row icon="target" label="Aiming for" value={`About ${daysBack(answers)} days a year back`} />
          <Row icon="sparkle" label="Spending it on" value={extras.length ? extras.join(', ') : 'Not chosen'} />
          <Row
            icon="reload"
            label="Retake the quiz"
            value="Rebuild plan"
            last
            onPress={() => router.push({ pathname: '/onboarding', params: { retake: '1' } })}
          />
        </Section>
      </Up>

      {/* Blocking */}
      <Up delay={150}>
        <Section title="Blocking">
          <Row icon="calendar" label="Block hours" value={describe(schedule)} onPress={() => router.push('/schedule')} />
          <Row
            icon="grid"
            label="Apps & controls"
            value={`${apps.length} ${apps.length === 1 ? 'app' : 'apps'} · ${totalActive(on, apps)} blocked`}
            onPress={() => router.push('/features')}
          />
          <View style={[s.row, s.rowBorder, { flexDirection: 'column', alignItems: 'stretch', gap: 10, paddingVertical: 14 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="unlock" size={20} color={c.muted} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={s.rowLabel}>Daily unlock budget</Text>
                <Text style={s.small}>Each unlock uses {UNLOCK_MIN} minutes</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {BUDGETS.map((b) => {
                const on = settings.budgetMin === b;
                return (
                  <Pressable
                    key={b}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={b === 0 ? 'No unlocks' : `${b} minutes`}
                    onPress={() => {
                      tap();
                      eased('Raise your unlock budget?', 'Raise budget', () => setSetting('budgetMin', b), blocked && b > settings.budgetMin);
                    }}
                    style={[s.budget, { backgroundColor: on ? c.accent : c.chip }]}>
                    <Text style={[s.budgetText, { color: on ? c.onAccent : c.text }]}>{b === 0 ? 'None' : `${b}m`}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={[s.row, s.rowBorder, { flexDirection: 'column', alignItems: 'stretch', gap: 10, paddingVertical: 14 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="timer" size={20} color={c.muted} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={s.rowLabel}>Unblock difficulty</Text>
                <Text style={s.small}>Turning blocking off makes you wait: {ladderText(settings.difficulty)}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DIFFICULTIES.map((d) => {
                const sel = settings.difficulty === d;
                return (
                  <Pressable
                    key={d}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: sel }}
                    onPress={() => {
                      tap();
                      if (sel) return;
                      // Going easier is itself a way out, so it costs a wait. Going harder is instant.
                      const easier = DIFFICULTIES.indexOf(d) < DIFFICULTIES.indexOf(settings.difficulty);
                      eased('Make unblocking easier?', 'Make it easier', () => setSetting('difficulty', d), easier);
                    }}
                    style={[s.budget, { backgroundColor: sel ? c.accent : c.chip }]}>
                    <Text style={[s.budgetText, { color: sel ? c.onAccent : c.text }]}>{DIFFICULTY_LABEL[d]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={[s.row, { gap: 12 }]}>
            <Icon name="lock" size={20} color={c.muted} />
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={s.rowLabel}>Strict focus</Text>
              <Text style={s.small}>Focus sessions can’t be ended early</Text>
            </View>
            <Toggle label="Strict focus" value={settings.strict} onChange={(v) => eased('Turn off strict focus?', 'Turn it off', () => setSetting('strict', v), blocked && !v)} />
          </View>
        </Section>
      </Up>

      {/* Feel */}
      <Up delay={200}>
        <Section title="Feel">
          <View style={[s.row, { gap: 12 }]}>
            <Icon name="sparkle" size={20} color={c.muted} />
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={s.rowLabel}>Vibration</Text>
              <Text style={s.small}>Taps, and the build-up when you hold a button</Text>
            </View>
            <Toggle label="Vibration" value={settings.haptics} onChange={(v) => setSetting('haptics', v)} />
          </View>
        </Section>
      </Up>

      {/* Data */}
      <Up delay={250}>
        <Section title="Your data">
          <Row icon="shield" label="Where it lives" value="Only on this phone" />
          <Row icon="chart" label="Days recorded" value={String(all.length)} />
          <Row icon="timer" label="Focus time, all time" value={`${totalFocus}m`} />
          <Row icon="clock" label="Time in apps, all time" value={fmtDuration(totalSeconds)} />
          <Row
            icon="trash"
            label="Clear statistics"
            onPress={() => confirm('Clear statistics?', 'This deletes your daily counts. Your plan and schedule stay.', 'Clear', () => eased('Clear your statistics?', 'Clear', clearStats, blocked))}
          />
          <Row
            icon="close"
            label="Reset everything"
            danger
            last
            onPress={() =>
              confirm('Reset everything?', 'This deletes your plan, schedule and statistics from this phone. It can’t be undone.', 'Reset', () =>
                eased(
                  'Reset everything?',
                  'Reset',
                  () => {
                    reset();
                    router.replace('/onboarding');
                  },
                  true,
                ),
              )
            }
          />
        </Section>
      </Up>

      {/* About */}
      <Up delay={300}>
        <Section title="About">
          <Row icon="scissors" label={APP_NAME} value={`Version ${Constants.expoConfig?.version ?? '1.0.0'}`} />
          <View style={[s.row, { paddingVertical: 14 }]}>
            <Text style={s.about}>
              {APP_NAME} opens Instagram, YouTube, Facebook, TikTok and more inside itself with their short-video feeds blocked during your
              block hours. It can’t change those apps when you open them from your home screen, so open them from here.
            </Text>
          </View>
        </Section>
      </Up>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      <Card style={{ paddingVertical: 2 }}>{children}</Card>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  danger = false,
  last = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  value?: string;
  danger?: boolean;
  last?: boolean;
  onPress?: () => void;
}) {
  const body = (
    <>
      <Icon name={icon} size={20} color={danger ? c.danger : c.muted} />
      <Text style={[s.rowLabel, danger && { color: c.danger }]}>{label}</Text>
      <Text style={s.rowValue} numberOfLines={1}>
        {value ?? ''}
      </Text>
      {onPress && !danger ? <Icon name="chevronRight" size={16} color={c.dim} /> : null}
    </>
  );
  const style = [s.row, { gap: 12 }, !last && s.rowBorder];
  if (!onPress) return <View style={style}>{body}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [...style, { opacity: pressed ? 0.6 : 1 }]}>
      {body}
    </Pressable>
  );
}

const s = StyleSheet.create({
  h1: { fontFamily: f.h600, fontSize: 28, letterSpacing: -0.5, color: c.text },

  profile: { backgroundColor: c.accent, borderRadius: 28, padding: 20, gap: 16 },
  name: { fontFamily: f.h700, fontSize: 24, letterSpacing: -0.5, color: c.onAccent },
  profileSub: { fontFamily: f.b500, fontSize: 13, color: c.onAccent },
  divider: { height: 1, backgroundColor: 'rgba(10,10,12,0.15)' },
  statValue: { fontFamily: f.h700, fontSize: 26, letterSpacing: -0.8, color: c.onAccent },
  statLabel: { fontFamily: f.b500, fontSize: 12, color: c.onAccent },

  sectionTitle: { fontFamily: f.b600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, color: c.muted, paddingHorizontal: 4 },
  row: { minHeight: 54, flexDirection: 'row', alignItems: 'center' },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: c.chip },
  rowLabel: { fontFamily: f.b400, fontSize: 15, color: c.text },
  rowValue: { flex: 1, fontFamily: f.b400, fontSize: 13, color: c.muted, textAlign: 'right' },
  small: { fontFamily: f.b400, fontSize: 12, color: c.muted },
  budget: { flex: 1, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  budgetText: { fontFamily: f.b600, fontSize: 14 },
  about: { fontFamily: f.b400, fontSize: 13, lineHeight: 20, color: c.muted },
});
