import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { up } from '../lib/anim';
import { tap } from '../lib/haptics';
import { c, f } from '../theme';

export { tap };

/** Fades and slides its children up on mount (the mock-up's `a-up`). */
export function Up({
  delay = 0,
  dist = 18,
  style,
  children,
}: {
  delay?: number;
  dist?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  return <Animated.View style={[up(delay, dist), style]}>{children}</Animated.View>;
}

/** Full-screen dark container with safe-area aware padding. */
export function Screen({
  children,
  padH = 20,
  top = 12,
  bottom = 8,
  style,
}: {
  children: React.ReactNode;
  padH?: number;
  top?: number;
  bottom?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: c.bg,
          paddingHorizontal: padH,
          paddingTop: Math.max(insets.top + top, 44),
          paddingBottom: Math.max(insets.bottom + bottom, 28),
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={() => {
        if (disabled) return;
        tap();
        onPress();
      }}
      style={style}>
      {({ pressed }) => (
        <Animated.View
          style={[
            s.primary,
            {
              backgroundColor: disabled ? c.track : c.accent,
              transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
              transitionProperty: ['backgroundColor', 'transform'],
              transitionDuration: '250ms',
            },
          ]}>
          <Text style={[s.primaryText, { color: disabled ? c.dim : c.onAccent }]}>{label}</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

/** 44px round outlined icon button (back / close). */
export function RoundButton({
  label,
  onPress,
  children,
  size = 44,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      style={[s.round, { width: size, height: size, borderRadius: size / 2 }]}>
      {children}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

/** iOS-style switch in the app's colours. */
export function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => {
        tap();
        onChange(!value);
      }}>
      <Animated.View
        style={[
          s.track,
          { backgroundColor: value ? c.accent : '#2E2E37', transitionProperty: 'backgroundColor', transitionDuration: '200ms' },
        ]}>
        <Animated.View
          style={[
            s.knob,
            {
              backgroundColor: value ? c.onAccent : c.muted,
              transform: [{ translateX: value ? 20 : 0 }],
              transitionProperty: ['transform', 'backgroundColor'],
              transitionDuration: '200ms',
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

export function Kicker({ children }: { children: React.ReactNode }) {
  return <Text style={s.kicker}>{children}</Text>;
}

const s = StyleSheet.create({
  primary: { height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontFamily: f.b600, fontSize: 16 },
  round: {
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  card: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 22, padding: 16 },
  track: { width: 52, height: 32, borderRadius: 16, padding: 4 },
  knob: { width: 24, height: 24, borderRadius: 12 },
  kicker: { fontFamily: f.b600, fontSize: 13, color: c.accent, textTransform: 'uppercase', letterSpacing: 1 },
});
