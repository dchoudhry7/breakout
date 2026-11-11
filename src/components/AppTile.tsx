import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { c } from '../theme';
import { Icon } from './Icons';

/**
 * Home-screen style app tile. These are our own simplified marks in each app's
 * familiar colour, not the official logos (those have trademark usage rules).
 */
function Mark({ id, size }: { id: string; size: number }) {
  const r = size * 0.28;
  switch (id) {
    case 'instagram':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Defs>
            <LinearGradient id="ig" x1="0" y1="1" x2="1" y2="0">
              <Stop offset="0" stopColor="#FEDA75" />
              <Stop offset="0.3" stopColor="#FA7E1E" />
              <Stop offset="0.55" stopColor="#D62976" />
              <Stop offset="0.8" stopColor="#962FBF" />
              <Stop offset="1" stopColor="#4F5BD5" />
            </LinearGradient>
          </Defs>
          <Rect width={64} height={64} rx={r * (64 / size)} fill="url(#ig)" />
          <Rect x={17} y={17} width={30} height={30} rx={9} fill="none" stroke="#fff" strokeWidth={3.4} />
          <Circle cx={32} cy={32} r={7} fill="none" stroke="#fff" strokeWidth={3.4} />
          <Circle cx={41} cy={23} r={2} fill="#fff" />
        </Svg>
      );
    case 'youtube':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Rect width={64} height={64} rx={r * (64 / size)} fill="#FF0033" />
          <Path d="M26 22.5v19l16-9.5z" fill="#fff" />
        </Svg>
      );
    case 'facebook':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Rect width={64} height={64} rx={r * (64 / size)} fill="#1877F2" />
          <Path
            d="M36.5 22h4v-7h-5.2c-5.2 0-8.3 3.2-8.3 8.4V28H22v7h5v15h7.5V35h5.2l.9-7h-6.1v-3.6c0-1.6.6-2.4 2-2.4z"
            fill="#fff"
          />
        </Svg>
      );
    case 'x':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Rect width={64} height={64} rx={r * (64 / size)} fill="#000" stroke="#2E2E37" strokeWidth={1.5} />
          <Path d="M21 20l22 24M43 20L21 44" stroke="#fff" strokeWidth={4.5} strokeLinecap="round" fill="none" />
        </Svg>
      );
    case 'reddit':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Rect width={64} height={64} rx={r * (64 / size)} fill="#FF4500" />
          <Path d="M32 26c9 0 15 4.500 15 10s-6 10-15 10-15-4.500-15-10 6-10 15-10z" fill="#fff" />
          <Circle cx={26} cy={35} r={2.600} fill="#FF4500" />
          <Circle cx={38} cy={35} r={2.600} fill="#FF4500" />
          <Path d="M32 26l2.500-9 7 1.600" stroke="#fff" strokeWidth={2.600} strokeLinecap="round" fill="none" />
          <Circle cx={43} cy={19} r={3} fill="#fff" />
        </Svg>
      );
    case 'threads':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Rect width={64} height={64} rx={r * (64 / size)} fill="#000" stroke="#2E2E37" strokeWidth={1.5} />
          <Path
            d="M43 31c-1-8-6-12-12-12-7 0-12 5-12 13s5 13 13 13c6 0 10-3 10-7s-4-6-9-6-8 2-8 5 3 4 5 4c5 0 7-4 7-10"
            stroke="#fff"
            strokeWidth={3.6}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      );
    case 'pinterest':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Rect width={64} height={64} rx={r * (64 / size)} fill="#E60023" />
          <Path
            d="M33 18c-8 0-12 5-12 10 0 3 1 5 3 6 .5.2 1 0 1-.5l.4-1.500c.1-.5 0-.7-.3-1-.7-.9-1.100-2-1.100-3.500 0-4.500 3.400-7.500 8-7.500 4 0 6.500 2.300 6.500 6 0 4.700-2 8.500-5 8.500-1.600 0-2.800-1.300-2.400-3 .5-2 1.400-4.200 1.400-5.700 0-1.300-.7-2.400-2.100-2.400-1.700 0-3 1.700-3 4 0 1.500.5 2.500.5 2.500l-2 8.500c-.5 2.500-.1 5.500 0 5.800.1.200.4.300.5.100.2-.3 2.400-3 3.200-5.800l1.200-4.700c.6 1.100 2.300 2 4 2 5.300 0 9-4.800 9-11 0-5-4.200-9.300-10.800-9.300z"
            fill="#fff"
          />
        </Svg>
      );
    case 'linkedin':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Rect width={64} height={64} rx={r * (64 / size)} fill="#0A66C2" />
          <Circle cx={21} cy={20.500} r={3.600} fill="#fff" />
          <Rect x={17.500} y={27} width={7} height={19} rx={1} fill="#fff" />
          <Path d="M29 27h6.500v2.600c1-1.800 3.200-3.100 6-3.100 5.500 0 6.500 3.600 6.500 8.300V46h-7v-9.500c0-2-.3-3.500-2.300-3.500-2.200 0-3 1.500-3 3.600V46H29z" fill="#fff" />
        </Svg>
      );
    case 'twitch':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Rect width={64} height={64} rx={r * (64 / size)} fill="#9146FF" />
          <Path d="M19 16h27v20l-8 8h-7l-5 5v-5h-7z" fill="#fff" />
          <Path d="M32 24v8M39 24v8" stroke="#9146FF" strokeWidth={3.400} strokeLinecap="round" />
        </Svg>
      );
    case 'tiktok':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Rect width={64} height={64} rx={r * (64 / size)} fill="#000" stroke="#2E2E37" strokeWidth={1.5} />
          <Path d="M35 17v21a6 6 0 1 1-6-6M35 17c0 5 3.500 9 9 9" stroke="#25F4EE" strokeWidth={4.500} strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(-1.500 -1.500)" />
          <Path d="M35 17v21a6 6 0 1 1-6-6M35 17c0 5 3.500 9 9 9" stroke="#FE2C55" strokeWidth={4.500} strokeLinecap="round" strokeLinejoin="round" fill="none" transform="translate(1.500 1.500)" />
          <Path d="M35 17v21a6 6 0 1 1-6-6M35 17c0 5 3.500 9 9 9" stroke="#fff" strokeWidth={4.500} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </Svg>
      );
    case 'snapchat':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Rect width={64} height={64} rx={r * (64 / size)} fill="#FFFC00" />
          <Path d="M32 15c-6 0-9 4.500-9 10v5c-2 .5-4 1-4 2.500s2 2 4 2.500c-1 3-4 4-5 5 0 1.500 3 2 5 2 1 1.500 3 2 4 2s2 1.500 5 1.500 4-1.500 5-1.500 3-.5 4-2c2 0 5-.5 5-2-1-1-4-2-5-5 2-.5 4-1 4-2.500S43 30.500 41 30v-5c0-5.500-3-10-9-10z" fill="#fff" stroke="#000" strokeWidth={2.600} strokeLinejoin="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64">
          <Rect width={64} height={64} rx={r * (64 / size)} fill={c.chip} />
        </Svg>
      );
  }
}

export function AppTile({ id, size = 64, locked = false }: { id: string; size?: number; locked?: boolean }) {
  return (
    <View style={{ width: size, height: size }}>
      <Mark id={id} size={size} />
      {locked && (
        <View
          style={{
            position: 'absolute',
            right: -5,
            bottom: -5,
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: c.accent,
            borderWidth: 2,
            borderColor: c.card,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon name="shield" size={12} color={c.onAccent} width={2.6} />
        </View>
      )}
    </View>
  );
}
