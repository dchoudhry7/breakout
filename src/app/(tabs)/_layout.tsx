import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconName } from '../../components/Icons';
import { ease } from '../../lib/anim';
import { tap } from '../../lib/haptics';
import { useNow, useStore } from '../../lib/store';
import { c } from '../../theme';

// Three tabs only. Apps sits in the centre; everything else lives behind Home and Profile.
const TABS: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  apps: { icon: 'grid', label: 'Apps' },
  insights: { icon: 'chart', label: 'Stats' },
};

const PILL = 72;
const PAD = 8;

type BarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigateToTab: (routeKey: string) => void;
};

/** Floating tab bar. The lime pill slides to whichever tab is selected. */
function PillBar({ state, navigateToTab }: BarProps) {
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const routes = state.routes.filter((r) => TABS[r.name]);
  const active = Math.max(0, routes.findIndex((r) => r.key === state.routes[state.index]?.key));
  const slot = routes.length ? (width - PAD * 2) / routes.length : 0;
  const x = PAD + slot * active + (slot - PILL) / 2;

  return (
    <View style={{ backgroundColor: c.bg, paddingBottom: Math.max(insets.bottom, 28), paddingTop: 12, paddingHorizontal: 16 }}>
      <View style={s.bar} accessibilityRole="tablist" onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {width > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              s.pill,
              {
                transform: [{ translateX: x }],
                transitionProperty: 'transform',
                transitionDuration: '380ms',
                transitionTimingFunction: ease,
              },
            ]}
          />
        )}
        {routes.map((route, i) => {
          const meta = TABS[route.name];
          const on = i === active;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={meta.label}
              accessibilityState={{ selected: on }}
              onPress={() => {
                if (on) return;
                tap();
                navigateToTab(route.key);
              }}
              style={s.item}>
              <Animated.View
                style={{
                  transform: [{ scale: on ? 1.08 : 1 }],
                  transitionProperty: 'transform',
                  transitionDuration: '300ms',
                }}>
                <Icon name={meta.icon} size={route.name === 'apps' ? 24 : 22} color={on ? c.onAccent : c.muted} />
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  // Close out a focus session once its time is up, whichever tab is showing.
  const { focusUntil, endFocus } = useStore();
  const now = useNow(5000);
  useEffect(() => {
    if (focusUntil && now.getTime() >= focusUntil) endFocus();
  }, [focusUntil, now, endFocus]);

  return (
    <Tabs
      tabBar={(props) => <PillBar state={props.state} navigateToTab={props.navigateToTab} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.bg }, animation: 'shift' }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="apps" />
      <Tabs.Screen name="insights" />
    </Tabs>
  );
}

const s = StyleSheet.create({
  bar: {
    height: 64,
    borderRadius: 32,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
  },
  pill: { position: 'absolute', left: 0, top: 7, width: PILL, height: 48, borderRadius: 24, backgroundColor: c.accent },
  item: { flex: 1, height: 62, alignItems: 'center', justifyContent: 'center' },
});
