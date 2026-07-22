import React, { forwardRef } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { COLORS, RADIUS, SIZE, FONT } from '../theme';

interface Props extends TextInputProps {
  icon?: string;
  containerStyle?: ViewStyle;
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
  variant?: 'pill' | 'card' | 'chat';
}

export const Input = forwardRef<TextInput, Props>(({
  icon, containerStyle, label, error, rightElement, variant = 'pill', style, ...rest
}, ref) => {
  const h = variant === 'chat' ? SIZE.inputChat : SIZE.inputPill;
  const radius = variant === 'card' ? RADIUS.card : RADIUS.pill;

  const borderColor = error ? COLORS.danger : COLORS.border;

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.wrapper,
        { height: h, borderRadius: radius, borderColor },
        variant === 'chat' && styles.chatWrapper,
      ]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={COLORS.textMuted}
          {...rest}
        />
        {rightElement && <View style={styles.rightEl}>{rightElement}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  label: {
    ...FONT.caption,
    color: COLORS.textMuted,
    marginBottom: 6,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderWidth: 1,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  chatWrapper: {
    backgroundColor: COLORS.bg,
  },
  icon: {
    fontSize: SIZE.iconSm,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  rightEl: {
    marginLeft: 8,
  },
  error: {
    ...FONT.caption,
    color: COLORS.danger,
    marginTop: 4,
    marginLeft: 4,
  },
});
