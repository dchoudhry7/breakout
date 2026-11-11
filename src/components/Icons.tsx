import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'scissors' | 'check' | 'chevronLeft' | 'chevronRight' | 'close' | 'arrowRight'
  | 'target' | 'moon' | 'clock' | 'smile' | 'frown' | 'meh' | 'cloud'
  | 'camera' | 'play' | 'users'
  | 'sun' | 'briefcase' | 'home' | 'bars1' | 'bars2' | 'bars3' | 'bars4'
  | 'trash' | 'timer' | 'dumbbell' | 'sparkle' | 'shield' | 'sliders'
  | 'calendar' | 'lock' | 'unlock' | 'plus' | 'minus' | 'reload' | 'book' | 'gear' | 'chart' | 'flame' | 'pencil' | 'grid' | 'user';

const BAR_PATHS = ['M5 20v-3', 'M10 20v-7', 'M15 20v-11', 'M20 20v-15'];

function glyph(name: IconName): React.ReactNode {
  switch (name) {
    case 'scissors':
      return (<><Circle cx={6} cy={6} r={3} /><Circle cx={6} cy={18} r={3} /><Path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" /></>);
    case 'check': return <Path d="M5 12l5 5L20 7" />;
    case 'chevronLeft': return <Path d="M15 18l-6-6 6-6" />;
    case 'chevronRight': return <Path d="M9 6l6 6-6 6" />;
    case 'close': return <Path d="M6 6l12 12M18 6 6 18" />;
    case 'arrowRight': return <Path d="M5 12h14M13 6l6 6-6 6" />;
    case 'target':
      return (<><Circle cx={12} cy={12} r={9} /><Circle cx={12} cy={12} r={5} /><Circle cx={12} cy={12} r={1} /></>);
    case 'moon': return <Path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />;
    case 'clock': return (<><Circle cx={12} cy={12} r={9} /><Path d="M12 7v5l3 2" /></>);
    case 'smile':
      return (<><Circle cx={12} cy={12} r={9} /><Path d="M8.5 14.5a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01" /></>);
    case 'frown':
      return (<><Circle cx={12} cy={12} r={9} /><Path d="M8.5 16a4 4 0 0 1 7 0M9 9.5h.01M15 9.5h.01" /></>);
    case 'meh':
      return (<><Circle cx={12} cy={12} r={9} /><Path d="M9 15h6M9 9.5h.01M15 9.5h.01" /></>);
    case 'cloud': return <Path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 10.5a3.8 3.8 0 0 1-.5 7.5z" />;
    case 'camera':
      return (<><Rect x={3} y={3} width={18} height={18} rx={5} /><Circle cx={12} cy={12} r={4} /><Path d="M17 7h.01" /></>);
    case 'play':
      return (<><Rect x={2.5} y={5} width={19} height={14} rx={4} /><Path d="M10 9.5v5l4.5-2.5z" /></>);
    case 'users':
      return (<><Circle cx={9} cy={8} r={3.5} /><Path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.5a6.5 6.5 0 0 1 3.5 5.5" /></>);
    case 'sun':
      return (<><Circle cx={12} cy={12} r={4} /><Path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>);
    case 'briefcase':
      return (<><Rect x={3} y={7} width={18} height={13} rx={2} /><Path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>);
    case 'home': return <Path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />;
    case 'bars1': case 'bars2': case 'bars3': case 'bars4': {
      const n = Number(name.slice(4));
      return BAR_PATHS.map((d, i) => <Path key={d} d={d} opacity={i < n ? 1 : 0.28} />);
    }
    case 'trash': return <Path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />;
    case 'timer': return (<><Circle cx={12} cy={13} r={8} /><Path d="M12 9v4l2 2M9 2h6" /></>);
    case 'dumbbell': return <Path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12" />;
    case 'sparkle': return <Path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16v4M17 18h4" />;
    case 'shield': return <Path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z" />;
    case 'sliders':
      return (<><Path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><Circle cx={16} cy={7} r={2} /><Circle cx={8} cy={17} r={2} /></>);
    case 'calendar':
      return (<><Rect x={3} y={5} width={18} height={16} rx={3} /><Path d="M3 10h18M8 3v4M16 3v4" /></>);
    case 'lock':
      return (<><Rect x={5} y={11} width={14} height={10} rx={2} /><Path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
    case 'unlock':
      return (<><Rect x={5} y={11} width={14} height={10} rx={2} /><Path d="M8 11V8a4 4 0 0 1 7.5-2" /></>);
    case 'plus': return <Path d="M12 5v14M5 12h14" />;
    case 'minus': return <Path d="M5 12h14" />;
    case 'book': return <Path d="M4 19V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2zM8 7h6" />;
    case 'gear':
      return (<><Circle cx={12} cy={12} r={3} /><Path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>);
    case 'chart': return <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />;
    case 'flame': return <Path d="M12 3c1 3 4 4.5 4 8.5a4 4 0 0 1-8 0c0-1.2.4-2.2 1-3 .2 1.2.8 2 1.6 2.3C10 8.500 10.500 5.500 12 3zM7 14a5 5 0 0 0 10 0" />;
    case 'pencil': return <Path d="M4 20h4L19 9l-4-4L4 16zM13.500 6.500l4 4" />;
    case 'grid':
      return (<><Rect x={4} y={4} width={6.5} height={6.5} rx={2} /><Rect x={13.5} y={4} width={6.5} height={6.5} rx={2} /><Rect x={4} y={13.5} width={6.5} height={6.5} rx={2} /><Rect x={13.5} y={13.5} width={6.5} height={6.5} rx={2} /></>);
    case 'user': return (<><Circle cx={12} cy={8} r={4} /><Path d="M4 21a8 8 0 0 1 16 0" /></>);
    case 'reload': return <Path d="M20 12a8 8 0 1 1-2.6-5.9M20 4v5h-5" />;
  }
}

export function Icon({
  name,
  size = 22,
  color = '#fff',
  width = 2,
}: {
  name: IconName;
  size?: number;
  color?: string;
  width?: number;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round">
      {glyph(name)}
    </Svg>
  );
}
