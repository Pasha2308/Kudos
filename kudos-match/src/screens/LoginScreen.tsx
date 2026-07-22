'use client';
import React, { useState, useContext } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, KeyboardAvoidingView,
  Platform, TouchableOpacity, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { COLORS, FONT, RADIUS, SIZE, SPACING, SHADOW } from '../theme';
import { SettingsContext } from '../contexts/SettingsContext';

type Mode = 'signup' | 'login';

export function LoginScreen() {
  const { apiUrl, setUserToken } = useContext(SettingsContext);
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (mode === 'signup' && !name.trim()) e.name = 'Please enter your name';
    if (!email.trim() || !email.includes('@')) e.email = 'Valid email required';
    if (!password || password.length < 6) e.password = 'Password must be 6+ characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAuth = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const endpoint = mode === 'signup' ? '/api/auth/register' : '/api/auth/login';
      const body = mode === 'signup' ? { email, password, name } : { email, password };

      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await AsyncStorage.setItem('@kudos_token', data.token);
        setUserToken(data.token);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Could not sign in', data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Connection failed', `Could not reach ${apiUrl}.\n\nCheck your network or API URL in Settings.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background gradient orb */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['rgba(251,207,232,0.4)', 'rgba(253,164,175,0.2)', 'transparent']}
          style={styles.orbGradient}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              style={styles.brandOrb}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.brandName}>Kudos</Text>
              <Text style={styles.brandTagline}>Stop being lonely. Start being real.</Text>
            </View>
          </View>

          {/* Segmented control */}
          <View style={styles.segmented}>
            {(['signup', 'login'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.segTab, mode === m && styles.segTabActive]}
                onPress={() => { setMode(m); setErrors({}); }}
                activeOpacity={0.8}
              >
                <Text style={[styles.segTabText, mode === m && styles.segTabTextActive]}>
                  {m === 'signup' ? 'Sign Up' : 'Log In'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form fields */}
          <View style={styles.form}>
            {mode === 'signup' && (
              <Input
                icon="👤"
                placeholder="What should I call you?"
                value={name}
                onChangeText={setName}
                error={errors.name}
                containerStyle={{ marginBottom: 12 }}
                autoCapitalize="words"
                returnKeyType="next"
              />
            )}
            <Input
              icon="✉️"
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              containerStyle={{ marginBottom: 12 }}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            <Input
              icon="🔒"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleAuth}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />
          </View>

          {/* Primary CTA */}
          <Button
            label={mode === 'signup' ? 'Start for Free  →' : 'Log In  →'}
            onPress={handleAuth}
            loading={loading}
            style={{ marginTop: 8, marginBottom: 20 }}
          />

          <TouchableOpacity
            onPress={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErrors({}); }}
            style={styles.switchBtn}
          >
            <Text style={styles.switchText}>
              {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={{ color: COLORS.primary, fontWeight: '600' }}>
                {mode === 'signup' ? 'Log In' : 'Sign Up'}
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons (UI only) */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}
              onPress={() => Alert.alert('Apple Sign In', 'Apple authentication coming soon.')}>
              <Text style={styles.socialIcon}>🍎</Text>
              <Text style={styles.socialLabel}>Apple</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}
              onPress={() => Alert.alert('Google Sign In', 'Google authentication coming soon.')}>
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialLabel}>Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  orbContainer: {
    position: 'absolute', top: -60, left: -80, width: 350, height: 350,
    borderRadius: 175, overflow: 'hidden',
  },
  orbGradient: { width: '100%', height: '100%' },
  scroll: {
    flexGrow: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },
  brand: {
    flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl,
  },
  brandOrb: {
    width: 48, height: 48, borderRadius: 24,
    ...SHADOW.glow,
  },
  brandName: {
    ...FONT.display, color: COLORS.text, fontSize: 28,
  },
  brandTagline: {
    ...FONT.caption, color: COLORS.textMuted, marginTop: 2,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface1,
    borderRadius: 12,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segTab: {
    flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center',
  },
  segTabActive: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.borderActive,
  },
  segTabText: { ...FONT.bodyBold, color: COLORS.textMuted },
  segTabTextActive: { color: COLORS.text },
  form: { marginBottom: SPACING.md },
  switchBtn: { alignItems: 'center', paddingVertical: 14 },
  switchText: { ...FONT.caption, color: COLORS.textMuted },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: SPACING.md, gap: 12,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { ...FONT.caption, color: COLORS.textMuted },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: SIZE.inputPill,
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  socialIcon: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  socialLabel: { ...FONT.bodyBold, color: COLORS.text },
});
