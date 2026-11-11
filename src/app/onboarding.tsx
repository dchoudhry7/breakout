import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Confetti } from '../components/Confetti';
import { HoldButton } from '../components/HoldButton';
import { Icon } from '../components/Icons';
import { OptionRow } from '../components/OptionRow';
import { ScheduleEditor } from '../components/ScheduleEditor';
import { Card, Kicker, PrimaryButton, RoundButton, Screen, tap, Up } from '../components/ui';
import { daysBack, daysBackFor, daysPerYear, goalName, hardestTime, timeLabel } from '../data/plan';
import { ANALYZE_STEPS, Answers, EXTRA_LABEL, Question, STEPS, TRIED_HEADLINE } from '../data/quiz';
import { describe, MODE_NAME, PRESETS, Schedule, ScheduleMode } from '../data/schedule';
import { cutsFor } from '../data/sites';
import { fade, fill, float, pop, pulse, spin } from '../lib/anim';
import { useCountUp, useStore } from '../lib/store';
import { APP_NAME, c, f } from '../theme';

type Phase = 'welcome' | 'steps' | 'analyzing' | 'plan';
type Draft = Partial<Answers>;

export default function Onboarding() {
  const { retake } = useLocalSearchParams<{ retake?: string }>();
  const isRetake = retake === '1';
  const { savePlan, answers: savedAnswers } = useStore();
  const [phase, setPhase] = useState<Phase>(isRetake ? 'steps' : 'welcome');
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [answers, setAnswers] = useState<Draft>(isRetake && savedAnswers ? { name: savedAnswers.name } : {});
  const [custom, setCustom] = useState<Schedule>(PRESETS.custom);
  const [stage, setStage] = useState<'in' | 'out' | 'pre'>('in');

  useEffect(() => {
    if (phase !== 'analyzing') return;
    const t = setTimeout(() => setPhase('plan'), 3400);
    return () => clearTimeout(t);
  }, [phase]);

  const step = STEPS[i];
  const name = (answers.name ?? '').trim();
  const mode = (answers.plan ?? 'always') as ScheduleMode;
  const schedule = mode === 'custom' ? custom : PRESETS[mode] ?? PRESETS.always;

  const pick = (q: Question, id: string) => {
    tap();
    setAnswers((a) => {
      if (q.multi) {
        const arr = (a[q.id] as string[] | undefined) ?? [];
        return { ...a, [q.id]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] };
      }
      return { ...a, [q.id]: id };
    });
  };

  // Fade the current step out first, then swap it, so steps never pop.
  const go = (d: 1 | -1, apply: () => void) => {
    if (stage !== 'in') return;
    setDir(d);
    setStage('out');
    setTimeout(() => {
      apply();
      setStage('pre');
      setTimeout(() => setStage('in'), 40);
    }, 180);
  };
  const back = () =>
    go(-1, () => {
      if (i > 0) setI(i - 1);
      else if (isRetake) router.back();
      else setPhase('welcome');
    });
  const next = () =>
    go(1, () => {
      if (i === STEPS.length - 1) setPhase('analyzing');
      else setI(i + 1);
    });

  if (phase === 'welcome') return <Welcome onStart={() => { setI(0); setDir(1); setPhase('steps'); }} />;
  if (phase === 'analyzing') return <Analyzing name={name} />;

  if (phase === 'plan') {
    const full = { ...answers, name, extra: answers.extra ?? [] } as Answers;
    return (
      <PlanView
        answers={full}
        schedule={schedule}
        onCustomChange={setCustom}
        onStart={() => {
          savePlan(full, schedule);
          router.replace('/(tabs)');
        }}
        onRetake={() => {
          setAnswers({ name });
          setI(0);
          setDir(1);
          setPhase(isRetake ? 'steps' : 'welcome');
        }}
      />
    );
  }

  const answered =
    step.kind === 'insight' || step.kind === 'commit'
      ? true
      : step.kind === 'text'
        ? name.length > 0
        : step.multi
          ? ((answers[step.id] as string[] | undefined) ?? []).length > 0
          : !!answers[step.id];

  const title = (q: Question) => (q.id === 'goal' && name ? `What do you want back, ${name}?` : q.title);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen bottom={4}>
        <View style={s.qHeader}>
          <RoundButton label="Back" onPress={back}>
            <Icon name="chevronLeft" size={20} color={c.text} />
          </RoundButton>
          <View style={s.track}>
            <Animated.View
              style={[
                s.trackFill,
                {
                  width: `${((i + 1) / STEPS.length) * 100}%`,
                  transitionProperty: 'width',
                  transitionDuration: '450ms',
                  transitionTimingFunction: 'ease-out',
                },
              ]}
            />
          </View>
          <Text style={s.stepLabel}>
            {i + 1}/{STEPS.length}
          </Text>
        </View>

        <Animated.View
          style={{
            flex: 1,
            opacity: stage === 'in' ? 1 : 0,
            transform: [{ translateX: stage === 'in' ? 0 : stage === 'out' ? -22 * dir : 22 * dir }],
            transitionProperty: ['opacity', 'transform'],
            transitionDuration: stage === 'out' ? '180ms' : stage === 'pre' ? '0ms' : '340ms',
            transitionTimingFunction: stage === 'out' ? 'ease-in' : 'ease-out',
          }}>
        <View key={i} style={{ flex: 1 }}>
          {step.kind === 'text' && (
            <View style={{ flex: 1, gap: 10 }}>
              <Up>
                <Text style={s.qTitle}>{step.title}</Text>
              </Up>
              <Up delay={60}>
                <Text style={s.qSub}>{step.sub}</Text>
              </Up>
              <Up delay={120}>
                <TextInput
                  value={answers.name ?? ''}
                  onChangeText={(v) => setAnswers((a) => ({ ...a, name: v }))}
                  placeholder={step.placeholder}
                  placeholderTextColor={c.dim}
                  accessibilityLabel={step.placeholder}
                  autoCapitalize="words"
                  autoCorrect={false}
                  maxLength={20}
                  returnKeyType="done"
                  onSubmitEditing={() => name.length > 0 && next()}
                  selectionColor={c.accent}
                  style={[s.input, { borderColor: name ? c.accent : c.border }]}
                />
              </Up>
              <Up delay={180}>
                <Text style={s.hi}>{name ? `Nice to meet you, ${name}` : 'Nice to meet you'}</Text>
              </Up>
            </View>
          )}

          {step.kind === 'insight' && step.id === 'yearly' && <YearlyInsight time={answers.time ?? 't2'} name={name} />}
          {step.kind === 'insight' && step.id === 'normal' && <NormalInsight tried={answers.tried ?? 'nothing'} />}

          {step.kind === 'commit' && (
            <CommitView name={name} answers={answers} schedule={schedule} />
          )}

          {step.kind === 'question' && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
              <Text style={s.qTitle}>{title(step)}</Text>
              <Text style={s.qSub}>{step.sub}</Text>
              <View style={{ gap: 10 }}>
                {step.options.map((o, j) => {
                  const value = answers[step.id];
                  const selected = step.multi ? ((value as string[] | undefined) ?? []).includes(o.id) : value === o.id;
                  const desc =
                    step.id === 'cut'
                      ? `About ${daysBackFor(answers.time ?? 't2', o.id)} days a year back`
                      : o.desc;
                  return (
                    <Up key={o.id} delay={j * 45} dist={10}>
                      <OptionRow
                        icon={o.icon}
                        label={o.label}
                        desc={desc}
                        multi={step.multi}
                        selected={selected}
                        onPress={() => pick(step, o.id)}
                      />
                    </Up>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
        </Animated.View>

        {step.kind === 'commit' ? (
          <HoldButton label="Hold to commit" onComplete={next} style={{ marginTop: 16 }} />
        ) : (
          <PrimaryButton label="Continue" disabled={!answered} onPress={next} style={{ marginTop: 16 }} />
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <Screen padH={24} top={20} bottom={12}>
      <View style={s.center}>
        <Animated.View style={[s.logoWrap, pop()]}>
          <Animated.View style={[s.logoRing, pulse()]} />
          <Animated.View style={[s.logoHalo, pulse(600)]} />
          <View style={s.logoCore}>
            <Icon name="shield" size={44} color={c.onAccent} />
          </View>
        </Animated.View>
      </View>
      <View style={{ gap: 12, marginBottom: 32 }}>
        <Up delay={150}>
          <Kicker>{APP_NAME}</Kicker>
        </Up>
        <Up delay={250}>
          <Text style={s.hero}>Keep the app.{'\n'}Lose the scroll.</Text>
        </Up>
        <Up delay={350}>
          <Text style={s.heroSub}>
            Answer a few quick questions and we’ll set up a plan that blocks Reels and Shorts at the hours you choose —
            without deleting anything.
          </Text>
        </Up>
      </View>
      <Up delay={450}>
        <PrimaryButton label="Build my plan" onPress={onStart} />
      </Up>
      <Animated.View style={fade(700)}>
        <Text style={s.fine}>Takes about 90 seconds</Text>
      </Animated.View>
    </Screen>
  );
}

/** Reflects the user's own estimate back as days per year, counting up. */
function YearlyInsight({ time, name }: { time: string; name: string }) {
  const days = daysPerYear(time);
  const shown = useCountUp(days, 1100);
  return (
    <View style={{ flex: 1, gap: 16 }}>
      <Up>
        <Kicker>That adds up{name ? `, ${name}` : ''}</Kicker>
      </Up>
      <Up delay={60}>
        <Text style={s.qTitle}>About {days} full days a year</Text>
      </Up>
      <Up delay={120}>
        <Text style={s.insightBody}>
          That’s what {timeLabel(time)} of short videos comes to over a year, counted as whole days and nights. The
          next few questions decide how much of it you take back.
        </Text>
      </Up>
      <View style={s.center}>
        <Animated.View style={pop(200, 550, 0.4, 1.1)}>
          <Animated.View style={[s.insightTile, float]}>
            <Text style={s.insightBig}>{shown}</Text>
            <Text style={s.insightLabel}>days a year in the feed</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
}

/** Reassurance after "what have you tried": the feed is the problem, not the person. */
function NormalInsight({ tried }: { tried: string }) {
  return (
    <View style={{ flex: 1, gap: 16 }}>
      <Up>
        <Kicker>It’s not just you</Kicker>
      </Up>
      <Up delay={60}>
        <Text style={s.qTitle}>{TRIED_HEADLINE[tried] ?? TRIED_HEADLINE.nothing}</Text>
      </Up>
      <Up delay={120}>
        <Text style={s.insightBody}>
          A short-video feed has no last video, so there is never a natural moment to stop. Stopping always costs
          effort. {APP_NAME} takes the feed away instead, so there is nothing left to resist.
        </Text>
      </Up>
      <View style={s.center}>
        <Animated.View style={pop(200, 550, 0.4, 1.1)}>
          <View style={s.snipWrap}>
            <Animated.View style={[s.snipRing, pulse()]} />
            <Animated.View style={[s.snipCore, float]}>
              <Icon name="shield" size={54} color={c.onAccent} />
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function CommitView({ name, answers, schedule }: { name: string; answers: Draft; schedule: Schedule }) {
  const back = daysBackFor(answers.time ?? 't2', answers.cut ?? 'half');
  const lines = [
    `Block Reels and Shorts: ${describe(schedule)}`,
    `Open my apps through ${APP_NAME}`,
    `Take back about ${back} days a year`,
  ];
  return (
    <View style={{ flex: 1, gap: 16 }}>
      <Up>
        <Kicker>Last step</Kicker>
      </Up>
      <Up delay={60}>
        <Text style={s.qTitle}>{name ? `Ready, ${name}?` : 'Ready?'}</Text>
      </Up>
      <Up delay={120}>
        <Text style={s.insightBody}>This is what you’re signing up for. Press and hold the button to lock it in.</Text>
      </Up>
      <View style={{ gap: 12, marginTop: 8 }}>
        {lines.map((line, j) => (
          <Up key={line} delay={220 + j * 140}>
            <Card style={s.promise}>
              <View style={s.stepDot}>
                <Icon name="check" size={14} width={3} color={c.onAccent} />
              </View>
              <Text style={s.promiseText}>{line}</Text>
            </Card>
          </Up>
        ))}
      </View>
    </View>
  );
}

function Analyzing({ name }: { name: string }) {
  return (
    <Screen padH={24} style={{ justifyContent: 'center', gap: 36 }}>
      <Animated.View style={[{ alignSelf: 'center', width: 120, height: 120 }, pop()]}>
        <Animated.View style={spin}>
          <Svg width={120} height={120} viewBox="0 0 120 120">
            <Circle cx={60} cy={60} r={52} fill="none" stroke={c.track} strokeWidth={8} />
            <Circle
              cx={60}
              cy={60}
              r={52}
              fill="none"
              stroke={c.accent}
              strokeWidth={8}
              strokeLinecap="round"
              strokeDasharray="90 237"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
      <View style={{ gap: 8, alignItems: 'center' }}>
        <Up>
          <Text style={s.analyzeTitle}>{name ? `Building ${name}’s plan` : 'Building your plan'}</Text>
        </Up>
        <Up delay={100}>
          <Text style={s.qSub}>Matching your answers to the right setup</Text>
        </Up>
      </View>
      <View style={s.track6}>
        <Animated.View style={[s.trackFill, fill]} />
      </View>
      <View style={{ gap: 14 }}>
        {ANALYZE_STEPS.map((st) => (
          <Up key={st.label} delay={st.delay} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={s.stepDot}>
              <Icon name="check" size={14} width={3} color={c.onAccent} />
            </View>
            <Text style={s.stepText}>{st.label}</Text>
          </Up>
        ))}
      </View>
    </Screen>
  );
}

function PlanView({
  answers,
  schedule,
  onCustomChange,
  onStart,
  onRetake,
}: {
  answers: Answers;
  schedule: Schedule;
  onCustomChange: (s: Schedule) => void;
  onStart: () => void;
  onRetake: () => void;
}) {
  const cuts = cutsFor(answers.apps);
  const back = useCountUp(daysBack(answers), 1200);
  const extras = answers.extra.map((x) => EXTRA_LABEL[x]).filter(Boolean);
  return (
    <Screen bottom={0}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 14, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Up>
          <Kicker>{answers.name ? `${answers.name}, your plan is ready` : 'Your plan is ready'}</Kicker>
        </Up>
        <Up delay={50}>
          <Text style={s.planTitle}>Your {goalName(answers)} plan</Text>
        </Up>

        <Up delay={120}>
          <View style={s.backCard}>
            <Text style={s.backLabel}>You’re taking back about</Text>
            <Text style={s.backBig}>
              {back}
              <Text style={s.backUnit}> days a year</Text>
            </Text>
            {extras.length > 0 && <Text style={s.backFor}>For {extras.join(', ')}.</Text>}
          </View>
        </Up>

        <Up delay={200}>
          <Card style={{ gap: 10 }}>
            <Text style={s.cardLabel}>We’ll block</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {cuts.map((label) => (
                <View key={label} style={s.chip}>
                  <View style={s.chipDot} />
                  <Text style={s.chipText}>{label}</Text>
                </View>
              ))}
            </View>
          </Card>
        </Up>

        <Up delay={280} style={{ flexDirection: 'row', gap: 10 }}>
          <Card style={s.tile}>
            <Text style={s.small}>Blocked during</Text>
            <Text style={s.tileValue}>{MODE_NAME[schedule.mode]}</Text>
            <Text style={s.small}>{describe(schedule)}</Text>
          </Card>
          <Card style={s.tile}>
            <Text style={s.small}>Your hardest time</Text>
            <Text style={s.tileValue}>{hardestTime(answers.when)}</Text>
          </Card>
        </Up>

        {schedule.mode === 'custom' && (
          <Up delay={320}>
            <ScheduleEditor value={schedule} onChange={onCustomChange} />
          </Up>
        )}

        <View style={{ flex: 1 }} />
        <Up delay={380}>
          <PrimaryButton label="Start my plan" onPress={onStart} />
        </Up>
        <Pressable accessibilityRole="button" onPress={onRetake} style={s.ghost}>
          <Text style={s.ghostText}>Retake quiz</Text>
        </Pressable>
      </ScrollView>
      <Confetti />
    </Screen>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  logoRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 110, borderWidth: 1, borderColor: c.accent },
  logoHalo: { position: 'absolute', top: 28, left: 28, right: 28, bottom: 28, borderRadius: 82, backgroundColor: 'rgba(212,255,58,0.16)' },
  logoCore: { width: 96, height: 96, borderRadius: 48, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  hero: { fontFamily: f.h700, fontSize: 44, lineHeight: 45, letterSpacing: -1.5, color: c.text },
  heroSub: { fontFamily: f.b400, fontSize: 16, lineHeight: 24, color: c.soft },
  fine: { fontFamily: f.b400, fontSize: 13, color: c.muted, textAlign: 'center', marginTop: 14 },

  qHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: c.track, overflow: 'hidden' },
  track6: { height: 6, borderRadius: 3, backgroundColor: c.track, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: c.accent },
  stepLabel: { fontFamily: f.b400, fontSize: 13, color: c.muted, width: 40, textAlign: 'right' },
  qTitle: { fontFamily: f.h700, fontSize: 30, lineHeight: 33, letterSpacing: -0.8, color: c.text },
  qSub: { fontFamily: f.b400, fontSize: 15, color: c.muted, marginBottom: 14 },
  input: {
    height: 64,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: c.card,
    paddingHorizontal: 18,
    fontFamily: f.h600,
    fontSize: 22,
    color: c.text,
  },

  insightBody: { fontFamily: f.b400, fontSize: 17, lineHeight: 26, color: c.body },
  insightTile: {
    width: 190,
    height: 190,
    borderRadius: 48,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  insightBig: { fontFamily: f.h700, fontSize: 72, lineHeight: 76, letterSpacing: -3, color: c.accent },
  insightLabel: { fontFamily: f.b400, fontSize: 13, color: c.muted },
  snipWrap: { width: 190, height: 190, alignItems: 'center', justifyContent: 'center' },
  snipRing: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 95, borderWidth: 1, borderColor: c.accent },
  snipCore: { width: 120, height: 120, borderRadius: 40, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },

  hi: { fontFamily: f.b500, fontSize: 15, color: c.accent, marginTop: 6, paddingHorizontal: 4 },
  promise: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 14 },
  promiseText: { flex: 1, fontFamily: f.b500, fontSize: 15, lineHeight: 21, color: c.text },

  analyzeTitle: { fontFamily: f.h700, fontSize: 28, letterSpacing: -0.6, color: c.text, textAlign: 'center' },
  stepDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontFamily: f.b400, fontSize: 15, color: c.text },

  planTitle: { fontFamily: f.h700, fontSize: 32, lineHeight: 35, letterSpacing: -1, color: c.text },
  backCard: { backgroundColor: c.accent, borderRadius: 26, padding: 20, gap: 4 },
  backLabel: { fontFamily: f.b600, fontSize: 13, color: c.onAccent },
  backBig: { fontFamily: f.h700, fontSize: 52, lineHeight: 56, letterSpacing: -2, color: c.onAccent },
  backUnit: { fontFamily: f.h600, fontSize: 18, letterSpacing: 0 },
  backFor: { fontFamily: f.b500, fontSize: 14, color: c.onAccent },
  cardLabel: { fontFamily: f.b400, fontSize: 14, color: c.muted },
  small: { fontFamily: f.b400, fontSize: 12, color: c.muted },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: c.chip, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
  chipText: { fontFamily: f.b500, fontSize: 13, color: c.text },
  tile: { flex: 1, borderRadius: 20, padding: 14, gap: 4 },
  tileValue: { fontFamily: f.b600, fontSize: 15, lineHeight: 20, color: c.text },
  ghost: { height: 44, alignItems: 'center', justifyContent: 'center' },
  ghostText: { fontFamily: f.b400, fontSize: 14, color: c.muted },
});
