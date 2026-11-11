import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { bounce, pop } from '../lib/anim';
import { c, f } from '../theme';
import { Icon, IconName } from './Icons';

const transition: {
  transitionProperty: ('backgroundColor' | 'borderColor' | 'transform')[];
  transitionDuration: `${number}ms`;
} = {
  transitionProperty: ['backgroundColor', 'borderColor', 'transform'],
  transitionDuration: '200ms',
};

/** Selectable card with an icon, a label, a description and a radio/checkbox mark. */
export function OptionRow({
  icon,
  label,
  desc,
  multi = false,
  grow = false,
  selected,
  onPress,
}: {
  icon: IconName;
  label: string;
  desc: string;
  multi?: boolean;
  /** Stretch to share the available height with sibling options. */
  grow?: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={multi ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${label}. ${desc}`}
      onPress={onPress}
      style={grow ? { flex: 1 } : undefined}>
      {({ pressed }) => (
        <Animated.View
          style={[
            s.opt,
            grow && { flex: 1 },
            transition,
            {
              backgroundColor: selected ? c.selected : c.card,
              borderColor: selected ? c.accent : c.border,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}>
          <Animated.View
            key={selected ? 'on' : 'off'}
            style={[s.icon, { backgroundColor: selected ? c.accent : c.chip }, selected && bounce]}>
            <Icon name={icon} size={20} color={selected ? c.onAccent : c.text} />
          </Animated.View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={s.label}>{label}</Text>
            <Text style={s.desc}>{desc}</Text>
          </View>
          <Animated.View
            style={[
              s.check,
              transition,
              {
                borderRadius: multi ? 7 : 12,
                borderColor: selected ? c.accent : c.ring,
                backgroundColor: selected ? c.accent : 'transparent',
              },
            ]}>
            {selected && (
              <Animated.View style={pop()}>
                <Icon name="check" size={14} width={3} color={c.onAccent} />
              </Animated.View>
            )}
          </Animated.View>
        </Animated.View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  opt: {
    minHeight: 64,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: f.b600, fontSize: 16, color: c.text },
  desc: { fontFamily: f.b400, fontSize: 13, color: c.muted },
  check: { width: 24, height: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
