import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, TouchableWithoutFeedback, StyleSheet, ScrollView, Dimensions, PanResponder } from 'react-native';
import { COLORS, RADIUS, SIZE, SHADOW } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  visible: boolean;
  onClose: () => void;
  title?: string;
  height?: number;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, height = SIZE.bottomSheet, children }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, damping: 20, mass: 1, stiffness: 200, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible && translateY._value === SCREEN_HEIGHT) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'none'}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { height, transform: [{ translateY }] }]}>
        {/* Drag handle */}
        <View style={styles.handleBar} />

        {title && (
          <View style={styles.titleRow}>
            <Text style={styles.titleText}>{title}</Text>
          </View>
        )}

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...SHADOW.modal,
    overflow: 'hidden',
  },
  handleBar: {
    width: SIZE.dragHandleW,
    height: SIZE.dragHandle,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: RADIUS.pill,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  titleRow: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titleText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
