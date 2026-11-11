export type ScheduleMode = 'always' | 'work' | 'night' | 'custom';

export type Schedule = {
  mode: ScheduleMode;
  /** Minutes from midnight. If start > end the window crosses midnight. */
  start: number;
  end: number;
  /** Days the window starts on. 0 = Sunday. */
  days: number[];
};

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export const PRESETS: Record<ScheduleMode, Schedule> = {
  always: { mode: 'always', start: 0, end: 0, days: ALL_DAYS },
  work: { mode: 'work', start: 9 * 60, end: 17 * 60, days: [1, 2, 3, 4, 5] },
  night: { mode: 'night', start: 21 * 60, end: 7 * 60, days: ALL_DAYS },
  custom: { mode: 'custom', start: 9 * 60, end: 17 * 60, days: ALL_DAYS },
};

export const MODE_NAME: Record<ScheduleMode, string> = {
  always: 'All day',
  work: 'Work hours',
  night: 'Evenings and nights',
  custom: 'My own hours',
};

export const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const fmtTime = (min: number) => {
  const m = ((min % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};

export function isBlocked(s: Schedule, now = new Date()): boolean {
  if (s.mode === 'always') return true;
  const day = now.getDay();
  const min = now.getHours() * 60 + now.getMinutes();
  const today = s.days.includes(day);
  if (s.start === s.end) return today; // whole day on the chosen days
  if (s.start < s.end) return today && min >= s.start && min < s.end;
  // Crosses midnight: the late part belongs to today, the early part to yesterday's window.
  const yesterday = s.days.includes((day + 6) % 7);
  return (today && min >= s.start) || (yesterday && min < s.end);
}

/** When the blocked/unblocked state next flips, or null if it never does. */
export function nextChange(s: Schedule, now = new Date()): Date | null {
  if (s.mode === 'always') return null;
  const current = isBlocked(s, now);
  const t = new Date(now);
  t.setSeconds(0, 0);
  for (let i = 1; i <= 7 * 1440; i++) {
    t.setMinutes(t.getMinutes() + 1);
    if (isBlocked(s, t) !== current) return t;
  }
  return null;
}

export function fmtWhen(d: Date, now = new Date()) {
  const time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? time : `${DAY_NAMES[d.getDay()]} ${time}`;
}

function daysLabel(days: number[]) {
  const set = [...days].sort();
  if (set.length === 7) return 'every day';
  if (set.join() === '1,2,3,4,5') return 'Mon to Fri';
  if (set.join() === '0,6') return 'weekends';
  return set.map((d) => DAY_NAMES[d]).join(', ');
}

export function describe(s: Schedule) {
  if (s.mode === 'always') return 'All day, every day';
  if (s.start === s.end) return `All day, ${daysLabel(s.days)}`;
  return `${fmtTime(s.start)} – ${fmtTime(s.end)}, ${daysLabel(s.days)}`;
}

export type BlockState = {
  /** Feeds are being cut right now. */
  blocked: boolean;
  /** A focus session is running (blocks regardless of the schedule). */
  focus: boolean;
  /** The schedule says block, but the user has unlocked for a few minutes. */
  paused: boolean;
  /** When the current state next flips, or null if it never does. */
  change: Date | null;
};

/** Combines the schedule with a running focus session and a temporary unlock. */
export function blockState(
  s: Schedule,
  t: { pauseUntil: number | null; focusUntil: number | null },
  now = new Date(),
): BlockState {
  const ms = now.getTime();
  const paused = !!t.pauseUntil && ms < t.pauseUntil;
  const focus = !!t.focusUntil && ms < t.focusUntil;
  const scheduled = isBlocked(s, now);
  if (paused && (scheduled || focus)) return { blocked: false, focus, paused: true, change: new Date(t.pauseUntil as number) };
  if (focus) return { blocked: true, focus: true, paused: false, change: new Date(t.focusUntil as number) };
  return { blocked: scheduled, focus: false, paused: false, change: nextChange(s, now) };
}
