import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';

const COLORS = ['#D4FF3A', '#F4F4F5', '#7CF5C8', '#B9A6FF', '#FFB86B'];

/** One-shot burst of falling confetti. Purely decorative. */
export function Confetti({ count = 32 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * width,
        size: 6 + Math.random() * 6,
        color: COLORS[i % COLORS.length],
        drift: (Math.random() - 0.5) * 120,
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        duration: 1900 + Math.random() * 1400,
        delay: Math.random() * 500,
        round: i % 3 === 0,
      })),
    [count, width],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: -20,
            left: p.left,
            width: p.size,
            height: p.round ? p.size : p.size * 1.8,
            borderRadius: p.round ? p.size / 2 : 2,
            backgroundColor: p.color,
            animationName: {
              '0%': { opacity: 1, transform: [{ translateY: 0 }, { translateX: 0 }, { rotate: '0deg' }] },
              '85%': { opacity: 1 },
              '100%': {
                opacity: 0,
                transform: [{ translateY: height + 40 }, { translateX: p.drift }, { rotate: `${p.spin}deg` }],
              },
            },
            animationDuration: `${Math.round(p.duration)}ms`,
            animationDelay: `${Math.round(p.delay)}ms`,
            animationTimingFunction: 'ease-in',
            animationFillMode: 'both',
          }}
        />
      ))}
    </View>
  );
}
