// Keyframe animations from the mock-up, expressed with Reanimated's CSS animation API.
import { cubicBezier } from 'react-native-reanimated';

export const ease = cubicBezier(0.2, 0.8, 0.2, 1);

const ms = (n: number) => `${n}ms` as const;

/** up: fade in while sliding up. */
export const up = (delay = 0, dist = 18) =>
  ({
    animationName: {
      from: { opacity: 0, transform: [{ translateY: dist }] },
      to: { opacity: 1, transform: [{ translateY: 0 }] },
    },
    animationDuration: ms(550),
    animationTimingFunction: ease,
    animationDelay: ms(delay),
    animationFillMode: 'both',
  }) as const;

/** fade */
export const fade = (delay = 0) =>
  ({
    animationName: { from: { opacity: 0 }, to: { opacity: 1 } },
    animationDuration: ms(600),
    animationTimingFunction: 'ease',
    animationDelay: ms(delay),
    animationFillMode: 'both',
  }) as const;

/** pop: scale in with a small overshoot. */
export const pop = (delay = 0, duration = 500, from = 0.6, over = 1.08) =>
  ({
    animationName: {
      '0%': { opacity: 0, transform: [{ scale: from }] },
      '70%': { opacity: 1, transform: [{ scale: over }] },
      '100%': { opacity: 1, transform: [{ scale: 1 }] },
    },
    animationDuration: ms(duration),
    animationTimingFunction: ease,
    animationDelay: ms(delay),
    animationFillMode: 'both',
  }) as const;

/** pulse: slow breathing ring. */
export const pulse = (delay = 0, minOpacity = 0.45) =>
  ({
    animationName: {
      '0%': { opacity: 0.9, transform: [{ scale: 1 }] },
      '50%': { opacity: minOpacity, transform: [{ scale: 1.14 }] },
      '100%': { opacity: 0.9, transform: [{ scale: 1 }] },
    },
    animationDuration: ms(2400),
    animationTimingFunction: 'ease-in-out',
    animationDelay: ms(delay),
    animationIterationCount: 'infinite',
  }) as const;

/** spin */
export const spin = {
  animationName: {
    from: { transform: [{ rotate: '0deg' }] },
    to: { transform: [{ rotate: '360deg' }] },
  },
  animationDuration: ms(1100),
  animationTimingFunction: 'linear',
  animationIterationCount: 'infinite',
} as const;

/** grow: bar grows up from its base. */
export const grow = (delay = 0) =>
  ({
    transformOrigin: 'bottom',
    animationName: {
      from: { transform: [{ scaleY: 0 }] },
      to: { transform: [{ scaleY: 1 }] },
    },
    animationDuration: ms(700),
    animationTimingFunction: ease,
    animationDelay: ms(delay),
    animationFillMode: 'both',
  }) as const;

/** fill: loading bar, 0 to 100% over 3s. */
export const fill = {
  animationName: { from: { width: '0%' }, to: { width: '100%' } },
  animationDuration: ms(3000),
  animationTimingFunction: cubicBezier(0.4, 0, 0.2, 1),
  animationFillMode: 'both',
} as const;

/** float: gentle hover. */
export const float = {
  animationName: {
    '0%': { transform: [{ translateY: 0 }] },
    '50%': { transform: [{ translateY: -8 }] },
    '100%': { transform: [{ translateY: 0 }] },
  },
  animationDuration: ms(3000),
  animationTimingFunction: 'ease-in-out',
  animationIterationCount: 'infinite',
} as const;

/** glow: expanding halo around today's cell. */
export const glow = {
  animationName: {
    '0%': { opacity: 0.55, transform: [{ scale: 1 }] },
    '50%': { opacity: 0, transform: [{ scale: 1.45 }] },
    '100%': { opacity: 0, transform: [{ scale: 1.45 }] },
  },
  animationDuration: ms(1800),
  animationTimingFunction: 'ease-in-out',
  animationIterationCount: 'infinite',
} as const;

/** Question transition: slides in from the side it is travelling from. */
export const slideIn = (dir: 1 | -1) =>
  ({
    animationName: {
      from: { opacity: 0, transform: [{ translateX: 26 * dir }] },
      to: { opacity: 1, transform: [{ translateX: 0 }] },
    },
    animationDuration: ms(420),
    animationTimingFunction: ease,
    animationFillMode: 'both',
  }) as const;

/** Small bounce used when an option is picked. */
export const bounce = {
  animationName: {
    '0%': { transform: [{ scale: 1 }] },
    '40%': { transform: [{ scale: 1.18 }] },
    '100%': { transform: [{ scale: 1 }] },
  },
  animationDuration: ms(320),
  animationTimingFunction: ease,
} as const;

/** Slow 8-second breath: grows for four seconds, settles for four. */
export const breathe = {
  animationName: {
    '0%': { transform: [{ scale: 0.9 }] },
    '50%': { transform: [{ scale: 1.08 }] },
    '100%': { transform: [{ scale: 0.9 }] },
  },
  animationDuration: ms(8000),
  animationTimingFunction: 'ease-in-out',
  animationIterationCount: 'infinite',
} as const;
