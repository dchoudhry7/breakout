import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { Answers } from '../data/quiz';
import { PRESETS, Schedule } from '../data/schedule';
import { defaultKeys, siteById } from '../data/sites';
import { dayKey, Days, DayStat, emptyDay, prune } from '../data/stats';
import { Difficulty, Gate, waitFor } from './friction';
import { setHapticsEnabled } from './haptics';

// Everything lives in on-device storage. Nothing is sent to a server.
const KEY = 'breakout/state/v1';

export const UNLOCK_MIN = 5;

export type Settings = {
  /** Minutes of temporary unlock allowed per day. */
  budgetMin: number;
  /** Focus sessions can't be ended early or unlocked. */
  strict: boolean;
  haptics: boolean;
  /** How steep the wait grows each time you try to turn blocking off (see friction.ts). */
  difficulty: Difficulty;
};

type Saved = {
  /** Unblock attempts today; the wait grows with the count. */
  friction: { day: string; count: number };
  /** The wait currently running, kept so leaving and returning can't reset it. */
  gate: Gate | null;
  answers: Answers | null;
  startedAt: string | null;
  /** Profile photo as a small data URI, kept on the phone. */
  photo: string | null;
  schedule: Schedule;
  /** Ids of the apps the user has added. */
  apps: string[];
  /** Keys of the features switched on (see sites.ts). */
  on: string[];
  settings: Settings;
  pauseUntil: number | null;
  focusUntil: number | null;
  focusStart: number | null;
  days: Days;
};

const EMPTY: Saved = {
  answers: null,
  startedAt: null,
  photo: null,
  schedule: PRESETS.always,
  apps: [],
  on: [],
  settings: { budgetMin: 15, strict: false, haptics: true, difficulty: 'medium' },
  friction: { day: '', count: 0 },
  gate: null,
  pauseUntil: null,
  focusUntil: null,
  focusStart: null,
  days: {},
};

type Store = Saved & {
  hydrated: boolean;
  today: DayStat;
  /** Unlock minutes left today. */
  budgetLeft: number;
  savePlan: (answers: Answers, schedule: Schedule) => void;
  setName: (name: string) => void;
  setPhoto: (uri: string | null) => void;
  setSchedule: (schedule: Schedule) => void;
  toggleFeature: (key: string) => void;
  addApp: (id: string) => void;
  removeApp: (id: string) => void;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  /** Takes UNLOCK_MIN from today's budget. Returns false if there isn't enough left. */
  unlock: () => boolean;
  resume: () => void;
  /** Starts (or continues) the wait for weakening blocking. Counts as one attempt today. */
  openGate: () => Gate;
  /** Called once the wait is done or skipped; the next attempt starts a fresh wait. */
  clearGate: () => void;
  startFocus: (minutes: number) => void;
  /** Ends the session and credits the minutes actually spent. */
  endFocus: () => void;
  recordDodge: (siteId: string) => void;
  addSeconds: (n: number) => void;
  clearStats: () => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);

const bump = (days: Days, fn: (d: DayStat) => DayStat): Days => {
  const k = dayKey();
  return { ...days, [k]: fn(days[k] ?? emptyDay()) };
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = useState<Saved>(EMPTY);
  const [hydrated, setHydrated] = useState(false);
  // Latest state for callbacks that must answer immediately (openGate returns the wait).
  const latest = useRef(saved);
  useEffect(() => {
    latest.current = saved;
  }, [saved]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const data = JSON.parse(raw);
        // Older saves had no app list: start from the quiz's choice with the default blocks on.
        const apps: string[] = data.apps ?? data.answers?.apps ?? [];
        const on: string[] = data.on ?? defaultKeys(apps).filter((k) => !(data.off ?? []).includes(k));
        setSaved({ ...EMPTY, ...data, apps, on, settings: { ...EMPTY.settings, ...data.settings }, days: prune(data.days ?? {}) });
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => setHapticsEnabled(saved.settings.haptics), [saved.settings.haptics]);

  const update = useCallback((fn: (s: Saved) => Saved) => {
    setSaved((prev) => {
      const next = fn(prev);
      if (next !== prev) AsyncStorage.setItem(KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const store = useMemo<Store>(() => {
    const today = saved.days[dayKey()] ?? emptyDay();
    return {
      ...saved,
      hydrated,
      today,
      budgetLeft: Math.max(0, saved.settings.budgetMin - today.unlockMin),
      savePlan: (answers, schedule) =>
        update((s) => ({
          ...s,
          answers,
          schedule,
          startedAt: s.startedAt ?? new Date().toISOString(),
          pauseUntil: null,
          // The quiz's choice becomes the user's app list, with the feed blocks switched on.
          apps: answers.apps,
          on: defaultKeys(answers.apps),
        })),
      setName: (name) => update((s) => (s.answers ? { ...s, answers: { ...s.answers, name } } : s)),
      setPhoto: (photo) => update((s) => ({ ...s, photo })),
      setSchedule: (schedule) => update((s) => ({ ...s, schedule, pauseUntil: null })),
      toggleFeature: (key) =>
        update((s) => ({ ...s, on: s.on.includes(key) ? s.on.filter((k) => k !== key) : [...s.on, key] })),
      addApp: (id) =>
        update((s) => (s.apps.includes(id) ? s : { ...s, apps: [...s.apps, id], on: [...s.on, ...defaultKeys([id])] })),
      removeApp: (id) =>
        update((s) => {
          const keys = (siteById(id)?.features ?? []).map((ft) => `${id}-${ft.id}`);
          return { ...s, apps: s.apps.filter((a) => a !== id), on: s.on.filter((k) => !keys.includes(k)) };
        }),
      setSetting: (key, value) => update((s) => ({ ...s, settings: { ...s.settings, [key]: value } })),
      unlock: () => {
        if (saved.settings.budgetMin - today.unlockMin < UNLOCK_MIN) return false;
        update((s) => ({
          ...s,
          pauseUntil: Date.now() + UNLOCK_MIN * 60000,
          days: bump(s.days, (d) => ({ ...d, unlocks: d.unlocks + 1, unlockMin: d.unlockMin + UNLOCK_MIN })),
        }));
        return true;
      },
      resume: () => update((s) => ({ ...s, pauseUntil: null })),
      openGate: () => {
        const cur = latest.current;
        const now = Date.now();
        if (cur.gate && now < cur.gate.expires) return cur.gate;
        const day = dayKey();
        const count = (cur.friction.day === day ? cur.friction.count : 0) + 1;
        const waitSec = waitFor(cur.settings.difficulty, count);
        const gate: Gate = { count, waitSec, readyAt: now + waitSec * 1000, expires: now + waitSec * 1000 + 90000 };
        // Update the ref straight away so a second call in the same tick reuses this gate.
        latest.current = { ...cur, gate, friction: { day, count } };
        update((s) => ({ ...s, gate, friction: { day, count } }));
        return gate;
      },
      clearGate: () => update((s) => (s.gate ? { ...s, gate: null } : s)),
      startFocus: (minutes) =>
        update((s) => ({ ...s, focusStart: Date.now(), focusUntil: Date.now() + minutes * 60000, pauseUntil: null })),
      endFocus: () =>
        update((s) => {
          if (!s.focusStart || !s.focusUntil) return s;
          const end = Math.min(Date.now(), s.focusUntil);
          const mins = Math.max(0, Math.round((end - s.focusStart) / 60000));
          return {
            ...s,
            focusStart: null,
            focusUntil: null,
            days: mins > 0 ? bump(s.days, (d) => ({ ...d, focusMin: d.focusMin + mins })) : s.days,
          };
        }),
      recordDodge: (siteId) =>
        update((s) => {
          const h = String(new Date().getHours());
          return {
            ...s,
            days: bump(s.days, (d) => ({
              ...d,
              dodges: d.dodges + 1,
              bySite: { ...d.bySite, [siteId]: (d.bySite[siteId] ?? 0) + 1 },
              byHour: { ...d.byHour, [h]: (d.byHour[h] ?? 0) + 1 },
            })),
          };
        }),
      addSeconds: (n) => update((s) => ({ ...s, days: bump(s.days, (d) => ({ ...d, seconds: d.seconds + n })) })),
      clearStats: () => update((s) => ({ ...s, days: {} })),
      reset: () => update(() => EMPTY),
    };
  }, [saved, hydrated, update]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside StoreProvider');
  return s;
}

/** Re-renders on an interval so time-based state (blocked or not) stays current. */
export function useNow(intervalMs = 20000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** Animates a whole number from 0 up to `target`. */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => {
      const k = Math.min(1, (Date.now() - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k >= 1) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [target, duration]);
  return value;
}
