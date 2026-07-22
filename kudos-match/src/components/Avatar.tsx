import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, RADIUS, SIZE } from '../theme';

type AvatarSize = 'xl' | 'lg' | 'md' | 'sm' | 'xs';

const sizeMap: Record<AvatarSize, number> = {
  xl: SIZE.avatarXl,
  lg: SIZE.avatarLg,
  md: SIZE.avatarMd,
  sm: SIZE.avatarSm,
  xs: SIZE.avatarXs,
};

const fontSizeMap: Record<AvatarSize, number> = {
  xl: 22, lg: 18, md: 16, sm: 13, xs: 11,
};

interface Props {
  name?: string;
  size?: AvatarSize;
  isOnline?: boolean;
  isCompanion?: boolean;
}

export function Avatar({ name = '?', size = 'md', isOnline, isCompanion }: Props) {
  const dim = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const initials = name.slice(0, 2).toUpperCase();

  const content = (
    <View style={[styles.inner, { width: dim, height: dim, borderRadius: dim / 2 }]}>
      <Text style={{ color: '#fff', fontSize, fontWeight: '700' }}>{initials}</Text>
    </View>
  );

  return (
    <View style={{ position: 'relative' }}>
      {isCompanion ? (
        <LinearGradient
          colors={COLORS.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: dim, height: dim, borderRadius: dim / 2, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: dim * 0.45 }}>🤖</Text>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: dim, height: dim, borderRadius: dim / 2, padding: 2 }}
        >
          <View style={[styles.inner, { borderRadius: dim / 2, width: dim - 4, height: dim - 4, backgroundColor: COLORS.surface2 }]}>
            <Text style={{ color: '#fff', fontSize, fontWeight: '700' }}>{initials}</Text>
          </View>
        </LinearGradient>
      )}

      {isOnline && (
        <View style={[styles.onlineDot, {
          width: SIZE.onlineDotSm,
          height: SIZE.onlineDotSm,
          borderRadius: SIZE.onlineDotSm / 2,
          bottom: 0,
          right: 0,
        }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  onlineDot: {
    position: 'absolute',
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.bg,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
