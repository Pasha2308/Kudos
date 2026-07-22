import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { COLORS, RADIUS, SHADOW, FONT } from '../theme';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface Props {
  message: string;
  type?: ToastType;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function Toast({ message, type = 'success', visible, onHide, duration = 2500 }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const colorMap: Record<ToastType, string> = {
    success: COLORS.success,
    info: COLORS.info,
    warning: COLORS.warning,
    error: COLORS.danger,
  };

  const emojiMap: Record<ToastType, string> = {
    success: '✓',
    info: 'ℹ',
    warning: '⚠',
    error: '✕',
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, damping: 15, stiffness: 200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const accent = colorMap[type];

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY }], opacity, borderColor: accent + '40' }]}>
      <View style={[styles.indicator, { backgroundColor: accent }]} />
      <Text style={[styles.emoji, { color: accent }]}>{emojiMap[type]}</Text>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
    zIndex: 9999,
    ...SHADOW.modal,
  },
  indicator: {
    width: 3,
    height: 24,
    borderRadius: 2,
  },
  emoji: {
    fontSize: 16,
    fontWeight: '700',
  },
  text: {
    ...FONT.body,
    color: COLORS.text,
    flex: 1,
  },
});
