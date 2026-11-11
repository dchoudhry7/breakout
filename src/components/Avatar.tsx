import React from 'react';
import { Image, Text, View } from 'react-native';

import { c, f } from '../theme';

/** Profile photo, or the first letter of the name when there isn't one. */
export function Avatar({
  photo,
  name,
  size,
  bg = c.chip,
  fg = c.text,
}: {
  photo: string | null;
  name: string;
  size: number;
  bg?: string;
  fg?: string;
}) {
  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        accessibilityIgnoresInvertColors
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg }}
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: f.h700, fontSize: size * 0.42, color: fg }}>{(name[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}
