import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

let enabled = true;

/** Set from the user's Haptics setting. */
export const setHapticsEnabled = (v: boolean) => {
  enabled = v;
};

const can = () => enabled && Platform.OS !== 'web';

/** Light tick for taps and selections. */
export function tap() {
  if (can()) Haptics.selectionAsync().catch(() => {});
}

/** Impact at one of three strengths: 0 light, 1 medium, 2 heavy. */
export function thud(level: 0 | 1 | 2) {
  if (!can()) return;
  const style = [Haptics.ImpactFeedbackStyle.Light, Haptics.ImpactFeedbackStyle.Medium, Haptics.ImpactFeedbackStyle.Heavy][level];
  Haptics.impactAsync(style).catch(() => {});
}

export function success() {
  if (can()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
