import type { IconName } from '../components/Icons';

export type Answers = {
  name: string;
  goal: string;
  apps: string[];
  time: string;
  when: string;
  feel: string;
  tried: string;
  cut: string;
  extra: string[];
  plan: string;
};

export type ChoiceId = Exclude<keyof Answers, 'name'>;

export type Option = { id: string; icon: IconName; label: string; desc: string };

export type Question = {
  kind: 'question';
  id: ChoiceId;
  title: string;
  sub: string;
  multi: boolean;
  options: Option[];
};

/** Free-text step. */
export type TextStep = { kind: 'text'; id: 'name'; title: string; sub: string; placeholder: string };

/** A short screen between questions that reflects the user's own answers back to them. */
export type Insight = { kind: 'insight'; id: 'yearly' | 'normal' };

/** Final press-and-hold step. */
export type Commit = { kind: 'commit' };

export type Step = Question | TextStep | Insight | Commit;

const o = (id: string, icon: IconName, label: string, desc: string): Option => ({ id, icon, label, desc });

export const STEPS: Step[] = [
  {
    kind: 'text',
    id: 'name',
    title: 'First, what should we call you?',
    sub: 'Just a first name or nickname. It stays on this phone.',
    placeholder: 'Your name',
  },
  {
    kind: 'question',
    id: 'goal',
    title: 'What do you want back?',
    sub: 'Pick the one that matters most right now.',
    multi: false,
    options: [
      o('focus', 'target', 'Focus', 'For studies or work'),
      o('sleep', 'moon', 'Better sleep', 'Stop the 1 AM scroll'),
      o('time', 'clock', 'My time', 'Hobbies, gym, people'),
      o('calm', 'smile', 'A calmer head', 'Less comparing, less noise'),
    ],
  },
  {
    kind: 'question',
    id: 'apps',
    title: 'Where do you get stuck?',
    sub: 'Select all that apply. You keep the app, only the endless feed goes.',
    multi: true,
    options: [
      o('instagram', 'camera', 'Instagram', 'Reels and Explore go, DMs stay'),
      o('youtube', 'play', 'YouTube', 'Shorts go, normal videos stay'),
      o('facebook', 'users', 'Facebook', 'Reels and Watch go, friends stay'),
      o('x', 'close', 'X (Twitter)', 'Explore and Trending go, your timeline stays'),
      o('reddit', 'smile', 'Reddit', 'Popular and All go, your communities stay'),
    ],
  },
  {
    kind: 'question',
    id: 'time',
    title: 'How long do you scroll short videos a day?',
    sub: 'A guess is fine.',
    multi: false,
    options: [
      o('t1', 'bars1', 'Under 1 hour', 'Mostly in short bursts'),
      o('t2', 'bars2', '1 to 2 hours', 'It adds up'),
      o('t3', 'bars3', '2 to 4 hours', 'Hard to stop once I start'),
      o('t4', 'bars4', 'More than 4 hours', 'Most of my free time'),
    ],
  },
  { kind: 'insight', id: 'yearly' },
  {
    kind: 'question',
    id: 'when',
    title: 'When does it hit hardest?',
    sub: 'This helps us suggest when to block.',
    multi: false,
    options: [
      o('morning', 'sun', 'Right after waking', 'Phone before feet hit the floor'),
      o('work', 'briefcase', 'During class or work', 'Quick checks that aren’t quick'),
      o('evening', 'home', 'After dinner', 'Couch mode'),
      o('night', 'moon', 'Late at night', 'One more reel, then 2 AM'),
    ],
  },
  {
    kind: 'question',
    id: 'feel',
    title: 'How do you feel after a long scroll?',
    sub: 'Be honest. Nobody else sees this.',
    multi: false,
    options: [
      o('drained', 'frown', 'Drained', 'Tired but still wired'),
      o('guilty', 'meh', 'Annoyed at myself', 'I meant to do something else'),
      o('foggy', 'cloud', 'Foggy', 'Hard to focus afterwards'),
      o('fine', 'smile', 'Mostly fine', 'I just want the time back'),
    ],
  },
  {
    kind: 'question',
    id: 'tried',
    title: 'What have you tried so far?',
    sub: 'Pick the closest one.',
    multi: false,
    options: [
      o('delete', 'trash', 'Deleting the apps', 'Reinstalled them within days'),
      o('limits', 'timer', 'Screen Time limits', 'Kept tapping “ignore”'),
      o('willpower', 'dumbbell', 'Willpower', 'Works until it doesn’t'),
      o('nothing', 'sparkle', 'Nothing yet', 'This is my first step'),
    ],
  },
  { kind: 'insight', id: 'normal' },
  {
    kind: 'question',
    id: 'cut',
    title: 'How much do you want to cut?',
    sub: 'Pick a target. You can always go further later.',
    multi: false,
    // Descriptions for this step are filled in from the user's own numbers.
    options: [
      o('half', 'bars2', 'Half of it', ''),
      o('most', 'bars1', 'Most of it', ''),
      o('all', 'shield', 'All of it', ''),
    ],
  },
  {
    kind: 'question',
    id: 'extra',
    title: 'What will you do with the time?',
    sub: 'Select anything that sounds good.',
    multi: true,
    options: [
      o('sleep', 'moon', 'Sleep more', 'Actually go to bed'),
      o('move', 'dumbbell', 'Move my body', 'Gym, walks, sport'),
      o('build', 'target', 'Study or build something', 'The thing I keep postponing'),
      o('people', 'users', 'See people', 'Friends and family, in person'),
      o('read', 'book', 'Read', 'Books, not captions'),
    ],
  },
  {
    kind: 'question',
    id: 'plan',
    title: 'When should Reels and Shorts be blocked?',
    sub: 'You can change this any time.',
    multi: false,
    options: [
      o('always', 'shield', 'All day', 'Blocked around the clock'),
      o('work', 'briefcase', 'Work hours', '9:00 – 17:00, Monday to Friday'),
      o('night', 'moon', 'Evenings and nights', '21:00 – 7:00, every day'),
      o('custom', 'sliders', 'My own hours', 'Pick the times and days yourself'),
    ],
  },
  { kind: 'commit' },
];

/** Headline for the "it's not just you" screen, by what the user has tried. */
export const TRIED_HEADLINE: Record<string, string> = {
  delete: 'Deleting the apps rarely sticks',
  limits: 'Limits are easy to tap past',
  willpower: 'Willpower runs out by evening',
  nothing: 'This is a good place to start',
};

export const EXTRA_LABEL: Record<string, string> = {
  sleep: 'sleep',
  move: 'moving',
  build: 'building',
  people: 'people',
  read: 'reading',
};

export const ANALYZE_STEPS = [
  { label: 'Reading your scroll triggers', delay: 300 },
  { label: 'Choosing feeds to block', delay: 1100 },
  { label: 'Setting your block hours', delay: 1900 },
  { label: 'Getting your apps ready', delay: 2700 },
];
