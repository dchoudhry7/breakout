/**
 * Turning blocking OFF costs time. Starting a block is always instant.
 *
 * Every time you try to weaken blocking (end a focus session, switch a control off,
 * spend unlock minutes, ...) you open a "gate". The wait grows with each gate opened
 * that day, like Opal: 5s, 20s, 50s, ... up to a cap set by the difficulty.
 */
export type Difficulty = 'easy' | 'medium' | 'hard' | 'brutal';

/** Seconds to wait on the 1st, 2nd, 3rd... gate of the day. The last value repeats. */
export const LADDERS: Record<Difficulty, number[]> = {
  easy: [5, 10, 20, 40, 60, 90, 120],
  medium: [5, 20, 50, 120, 300],
  hard: [10, 60, 180, 300, 600, 900],
  brutal: [30, 120, 300, 600, 1200, 1800],
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  brutal: 'Brutal',
};

export const DIFFICULTIES = Object.keys(LADDERS) as Difficulty[];

/** Seconds to wait for the n-th gate of the day (n starts at 1). */
export function waitFor(difficulty: Difficulty, n: number) {
  const ladder = LADDERS[difficulty] ?? LADDERS.medium;
  return ladder[Math.min(Math.max(n, 1), ladder.length) - 1];
}

export function fmtWait(sec: number) {
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

/** "5s → 20s → 50s → 2m → 5m" */
export function ladderText(difficulty: Difficulty) {
  return LADDERS[difficulty].map(fmtWait).join(' → ');
}

export type Gate = {
  /** Which gate of the day this is (1, 2, 3...). */
  count: number;
  waitSec: number;
  readyAt: number;
  /** Closing and reopening before this reuses the same timer, so backing out never resets the wait. */
  expires: number;
};
