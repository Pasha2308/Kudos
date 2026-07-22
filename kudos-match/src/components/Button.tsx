import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { COLORS, RADIUS, SIZE, SHADOW, FONT } from '../theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
  height?: number;
}

export function Button({ label, onPress, variant = 'primary', disabled, loading, icon, style, height }: Props) {
  const handlePress = () => {
    if (disabled || loading) return;
    if (variant === 'primary' || variant === 'success') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const h = height ?? (variant === 'primary' ? SIZE.btnPrimary : variant === 'danger' ? SIZE.btnDanger : SIZE.btnSecondary);
  const opacity = (disabled || loading) ? 0.45 : 1;

  const inner = (
    <View style={[styles.inner, { height: h }]}>
      {loading
        ? <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? COLORS.primary : '#fff'} />
        : <>
            {icon ? <Text style={styles.icon}>{icon}</Text> : null}
            <Text style={[styles.label, variantLabel[variant]]}>{label}</Text>
          </>
      }
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={[{ opacity }, style]} disabled={disabled || loading}>
        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} start={{x:0,y:0}} end={{x:1,y:1}}
          style={[styles.btn, { height: h, borderRadius: RADIUS.pill }]}>
          {inner}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'success') {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={[{ opacity }, style]} disabled={disabled || loading}>
        <View style={[styles.btn, { height: h, borderRadius: RADIUS.pill, backgroundColor: COLORS.success }]}>
          {inner}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.75} style={[{ opacity }, style]} disabled={disabled || loading}>
      <View style={[styles.btn, variantContainer[variant], { height: h }]}>
        {inner}
      </View>
    </TouchableOpacity>
  );
}

const variantContainer: Record<string, object> = {
  secondary: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
  },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderRadius: RADIUS.card,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: RADIUS.pill,
  },
};

const variantLabel: Record<string, object> = {
  primary:   { color: COLORS.text },
  secondary: { color: COLORS.text },
  danger:    { color: COLORS.danger },
  ghost:     { color: COLORS.primary },
  success:   { color: '#fff' },
};

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  icon: {
    fontSize: 18,
  },
});
