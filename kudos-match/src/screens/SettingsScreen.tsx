import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Avatar } from '../components/Avatar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { COLORS, FONT, RADIUS, SIZE, SPACING, SHADOW } from '../theme';
import { SettingsContext } from '../contexts/SettingsContext';

interface ToggleRowProps { label: string; value: boolean; onChange: (v: boolean) => void; }

function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(!value); }}
      activeOpacity={0.8}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={[styles.togglePill, value && styles.togglePillActive]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbRight]} />
      </View>
    </TouchableOpacity>
  );
}

export function SettingsScreen() {
  const { apiUrl, setApiUrl, setUserToken } = useContext(SettingsContext);
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailDigest: false,
    showOnlineStatus: true,
    readReceipts: false,
    profileVisibility: 'All',
  });
  const [apiInput, setApiInput] = useState(apiUrl);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });
  const userName = 'Test User';
  const userEmail = 'testuser@example.com';

  const update = (key: string, value: boolean) => setSettings(s => ({ ...s, [key]: value }));

  const saveApiUrl = () => {
    setApiUrl(apiInput.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast({ visible: true, message: 'API URL saved', type: 'success' });
  };

  const logOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setUserToken(null);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top'] as any}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <Avatar name={userName} size="lg" />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileEmail}>{userEmail}</Text>
            <TouchableOpacity onPress={() => setToast({ visible: true, message: 'Profile editing coming soon', type: 'info' })}>
              <Text style={styles.editLink}>Edit Profile →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.settingGroup}>
          <ToggleRow label="Push Notifications" value={settings.pushNotifications} onChange={v => update('pushNotifications', v)} />
          <View style={styles.divider} />
          <ToggleRow label="Email Digest" value={settings.emailDigest} onChange={v => update('emailDigest', v)} />
        </View>

        {/* Privacy */}
        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.settingGroup}>
          <ToggleRow label="Show Online Status" value={settings.showOnlineStatus} onChange={v => update('showOnlineStatus', v)} />
          <View style={styles.divider} />
          <ToggleRow label="Read Receipts" value={settings.readReceipts} onChange={v => update('readReceipts', v)} />
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Profile Visibility</Text>
            <Text style={styles.settingValue}>{settings.profileVisibility}</Text>
          </View>
        </View>

        {/* Companion */}
        <Text style={styles.sectionLabel}>Companion</Text>
        <View style={styles.settingGroup}>
          <TouchableOpacity style={styles.settingRow} onPress={() => setToast({ visible: true, message: 'Mode picker coming soon', type: 'info' })}>
            <Text style={styles.settingLabel}>Companion Mode</Text>
            <Text style={[styles.settingValue, { color: COLORS.primary }]}>Support →</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingRow} onPress={() => Alert.alert('Reset Companion', 'This will clear your companion\'s memory. Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Reset', style: 'destructive', onPress: () => setToast({ visible: true, message: 'Companion reset', type: 'info' }) },
          ])}>
            <Text style={styles.settingLabel}>Reset Companion Memory</Text>
            <Text style={[styles.settingValue, { color: COLORS.danger }]}>Reset →</Text>
          </TouchableOpacity>
        </View>

        {/* Developer */}
        <Text style={styles.sectionLabel}>Developer</Text>
        <View style={styles.settingGroup}>
          <View style={{ padding: SPACING.md }}>
            <Text style={styles.apiLabel}>API URL</Text>
            <Input
              value={apiInput}
              onChangeText={setApiInput}
              containerStyle={{ marginBottom: 10 }}
              placeholder="http://192.168.1.7:8080"
              autoCapitalize="none"
              keyboardType="url"
            />
            <Button label="Save API URL" onPress={saveApiUrl} variant="secondary" height={40} />
          </View>
        </View>

        {/* Log out */}
        <Button
          label="Log Out"
          onPress={logOut}
          variant="danger"
          style={{ marginTop: SPACING.xl, marginBottom: SPACING.xxl }}
        />
      </ScrollView>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: SPACING.lg },
  title: { ...FONT.display, color: COLORS.text, marginBottom: SPACING.lg },
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.lg, marginBottom: SPACING.lg, gap: 16, ...SHADOW.card,
  },
  profileInfo: { flex: 1 },
  profileName: { ...FONT.h2, color: COLORS.text, marginBottom: 4 },
  profileEmail: { ...FONT.caption, color: COLORS.textMuted, marginBottom: 8 },
  editLink: { ...FONT.caption, color: COLORS.primary, fontWeight: '700' },
  sectionLabel: { ...FONT.label, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: SPACING.sm },
  settingGroup: {
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SPACING.md, height: SIZE.tapMin + 8,
  },
  settingLabel: { ...FONT.body, color: COLORS.text },
  settingValue: { ...FONT.body, color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: SPACING.md },
  togglePill: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: COLORS.surface3, padding: 3,
  },
  togglePillActive: { backgroundColor: COLORS.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  toggleThumbRight: { marginLeft: 18 },
  apiLabel: { ...FONT.caption, color: COLORS.textMuted, marginBottom: 8 },
});
