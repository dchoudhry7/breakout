/** Everything the app counts, per calendar day. Stored only on the phone. */
export type DayStat = {
  /** Times a cut feed was stopped. */
  dodges: number;
  bySite: Record<string, number>;
  byHour: Record<string, number>;
  /** Temporary unlocks taken, and the minutes they used. */
  unlocks: number;
  unlockMin: number;
  /** Seconds spent inside the collection's apps. */
  seconds: number;
  /** Minutes of completed focus time. */
  focusMin: number;
};

export type Days = Record<string, DayStat>;

export const emptyDay = (): DayStat => ({
  dodges: 0,
  bySite: {},
  byHour: {},
  unlocks: 0,
  unlockMin: 0,
  seconds: 0,
  focusMin: 0,
});

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const dayAt = (days: Days, offset: number, now = new Date()): DayStat => {
  const d = new Date(now);
  d.setDate(d.getDate() - offset);
  return days[dayKey(d)] ?? emptyDay();
};

const LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** The last `n` days, oldest first, ending today (or `skip` days ago). */
export function lastDays(days: Days, n: number, now = new Date(), skip = 0) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - skip - (n - 1 - i));
    return { key: dayKey(d), label: LETTERS[d.getDay()], isToday: skip === 0 && i === n - 1, stat: days[dayKey(d)] ?? emptyDay() };
  });
}

export const sum = (list: { stat: DayStat }[], pick: (s: DayStat) => number) => list.reduce((n, d) => n + pick(d.stat), 0);

/** Hour of day (0-23) with the most stopped attempts over the given days, or null. */
export function riskiestHour(list: { stat: DayStat }[]): number | null {
  const totals: Record<string, number> = {};
  for (const d of list) for (const [h, n] of Object.entries(d.stat.byHour)) totals[h] = (totals[h] ?? 0) + n;
  const best = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  return best ? Number(best[0]) : null;
}

export const fmtHour = (h: number) => `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? 'AM' : 'PM'}`;

/** "1h 42m", "12m" or "0m". */
export function fmtDuration(seconds: number) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** Days in a row, ending today, without taking an unlock. Never longer than the time on the plan. */
export function streak(days: Days, startedAt: string | null, now = new Date()) {
  if (!startedAt) return 0;
  const start = new Date(startedAt);
  start.setHours(0, 0, 0, 0);
  let n = 0;
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  while (d.getTime() >= start.getTime() && n < 999) {
    if ((days[dayKey(d)]?.unlocks ?? 0) > 0) break;
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Drop anything older than `keep` days so storage stays small. */
export function prune(days: Days, keep = 90, now = new Date()): Days {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - keep);
  const min = dayKey(cutoff);
  const out: Days = {};
  for (const k of Object.keys(days)) if (k >= min) out[k] = days[k];
  return out;
}
