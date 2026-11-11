import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { success, thud } from '../lib/haptics';
import { c, f } from '../theme';

const STEPS = 36;

/** Keyframes for a shake that starts as a tremble and ends as a rattle. */
function shakeFrames() {
  const frames: Record<string, { transform: ({ translateX: number } | { rotate: string } | { scale: number })[] }> = {};
  for (let i = 0; i <= STEPS; i++) {
    const k = i / STEPS;
    const side = i % 2 === 0 ? 1 : -1;
    const amp = i === 0 || i === STEPS ? 0 : 1 + 8 * k * k;
    frames[`${Math.round(k * 100)}%`] = {
      transform: [{ translateX: side * amp }, { rotate: `${side * k * 1.6}deg` }, { scale: 1 + 0.04 * k }],
    };
  }
  return frames;
}

/**
 * A button that only fires after being held down. While you hold, it shakes
 * harder and harder and the vibration builds, then it fires.
 */
export function HoldButton({
  label,
  holdingLabel = 'Keep holding…',
  onComplete,
  duration = 1800,
  variant = 'solid',
  style,
}: {
  label: string;
  holdingLabel?: string;
  onComplete: () => void;
  duration?: number;
  /** 'text' renders as an underlined link, for secondary actions. */
  variant?: 'solid' | 'text';
  style?: StyleProp<ViewStyle>;
}) {
  const [holding, setHolding] = useState(false);
  const done = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulse = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True only while a finger is actually down on the button.
  const down = useRef(false);
  const mounted = useRef(Date.now());
  const frames = useMemo(shakeFrames, []);

  const clear = () => {
    if (done.current) clearTimeout(done.current);
    if (pulse.current) clearTimeout(pulse.current);
    done.current = null;
    pulse.current = null;
  };
  useEffect(() => clear, []);

  const start = () => {
    // A button that just replaced another (e.g. Start -> Hold to end) can catch the same tap.
    if (Date.now() - mounted.current < 700) return;
    clear();
    down.current = true;
    setHolding(true);
    const began = Date.now();
    // Vibration ramp: light and slow at first, heavy and rapid near the end.
    const beat = () => {
      const k = Math.min(1, (Date.now() - began) / duration);
      thud(k < 0.35 ? 0 : k < 0.7 ? 1 : 2);
      pulse.current = setTimeout(beat, 230 - 170 * k);
    };
    beat();
    done.current = setTimeout(() => {
      clear();
      // Only fire if the finger is still down; a lifted finger must never complete the hold.
      if (!down.current) {
        setHolding(false);
        return;
      }
      down.current = false;
      setHolding(false);
      success();
      onComplete();
    }, duration);
  };

  const cancel = () => {
    down.current = false;
    clear();
    setHolding(false);
  };

  const solid = variant === 'solid';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Press and hold"
      onPressIn={start}
      onPressOut={cancel}
      onTouchEnd={cancel}
      onTouchCancel={cancel}
      style={style}>
      {/* Not remounted between rest and hold: swapping the touched view mid-press loses the finger-up event. */}
      <Animated.View
        pointerEvents="none"
        style={[
          solid ? s.solid : s.text,
          solid && holding && { backgroundColor: c.accent },
          holding
            ? { animationName: frames, animationDuration: `${duration}ms`, animationTimingFunction: 'linear' }
            : { animationName: 'none' },
        ]}>
        <Text style={[solid ? s.solidLabel : s.textLabel, solid && holding && { color: c.onAccent }, !solid && holding && { color: c.accent }]}>
          {holding ? holdingLabel : label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  solid: {
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: c.accent,
    backgroundColor: c.selected,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  solidLabel: { fontFamily: f.b600, fontSize: 16, color: c.text },
  textLabel: { fontFamily: f.b500, fontSize: 13, color: c.muted, textDecorationLine: 'underline' },
});
