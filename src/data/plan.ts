import type { Answers } from './quiz';

const GOAL: Record<string, string> = { focus: 'Deep Focus', sleep: 'Sleep Reset', time: 'Time Reclaim', calm: 'Calm Mind' };

/** Midpoint hours per day for each answer, used only to reflect the user's own estimate back to them. */
const HOURS: Record<string, number> = { t1: 0.5, t2: 1.5, t3: 3, t4: 5 };
const TIME_LABEL: Record<string, string> = {
  t1: 'under an hour a day',
  t2: '1 to 2 hours a day',
  t3: '2 to 4 hours a day',
  t4: 'more than 4 hours a day',
};
const WHEN: Record<string, string> = {
  morning: 'Right after waking',
  work: 'During class or work',
  evening: 'After dinner',
  night: 'Late at night',
};

export const goalName = (a: Pick<Answers, 'goal'>) => GOAL[a.goal] ?? 'Deep Focus';

/** Full 24-hour days per year at the user's estimated daily scroll time. */
export const daysPerYear = (time: string) => Math.round(((HOURS[time] ?? 1.5) * 365) / 24);

export const timeLabel = (time: string) => TIME_LABEL[time] ?? TIME_LABEL.t2;

export const hardestTime = (when: string) => WHEN[when] ?? WHEN.night;

const CUT: Record<string, number> = { half: 0.5, most: 0.75, all: 1 };

/** Days per year the user is aiming to get back, from their own estimate and chosen target. */
export const daysBack = (a: Pick<Answers, 'time' | 'cut'>) => Math.max(1, Math.round(daysPerYear(a.time) * (CUT[a.cut] ?? 0.5)));
export const daysBackFor = (time: string, cut: string) => daysBack({ time, cut });
