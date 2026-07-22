import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { COLORS, FONT, RADIUS, SIZE, SPACING, SHADOW } from '../theme';
import { SettingsContext } from '../contexts/SettingsContext';

interface Kudo { id: string; fromUserName: string; triggeredByMessage: string; isRead: boolean; createdAt: any; direction: 'received' | 'given'; }

const MOCK_KUDOS: Kudo[] = [
  { id: 'k1', fromUserName: 'Priya', triggeredByMessage: "That I'm not always okay when I say I am.", isRead: false, createdAt: new Date(), direction: 'received' },
  { id: 'k2', fromUserName: 'Arjun', triggeredByMessage: "The honesty about struggling with the product.", isRead: true, createdAt: new Date(Date.now() - 86400000), direction: 'received' },
  { id: 'k3', fromUserName: 'You → Priya', triggeredByMessage: "Shipped her first SaaS while being a mom.", isRead: true, createdAt: new Date(Date.now() - 172800000), direction: 'given' },
];

export function KudosScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [kudos, setKudos] = useState<Kudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGive, setShowGive] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [kudoReason, setKudoReason] = useState('');
  const [giving, setGiving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });

  useEffect(() => {
    fetch(`${apiUrl}/api/kudos/received`, { headers: { 'Authorization': `Bearer ${userToken}` } })
      .then(r => r.json())
      .then(d => setKudos(d.kudos?.length ? d.kudos : MOCK_KUDOS))
      .catch(() => setKudos(MOCK_KUDOS))
      .finally(() => setLoading(false));
  }, []);

  const received = kudos.filter(k => k.direction === 'received');
  const given = kudos.filter(k => k.direction === 'given');
  const weeklyCount = received.length;

  const giveKudo = async () => {
    if (!recipientName.trim() || !kudoReason.trim()) return;
    setGiving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await fetch(`${apiUrl}/api/kudos/give`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ recipientName, reason: kudoReason }),
      });
    } catch (e) {}
    setGiving(false);
    setShowGive(false);
    setKudos(prev => [
      { id: String(Date.now()), fromUserName: `You → ${recipientName}`, triggeredByMessage: kudoReason, isRead: true, createdAt: new Date(), direction: 'given' },
      ...prev,
    ]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast({ visible: true, message: `Kudos sent to ${recipientName} 💛`, type: 'success' });
    setRecipientName('');
    setKudoReason('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top'] as any}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Kudos Moments 💛</Text>
        <Text style={styles.subtitle}>Private appreciation. Not a like button.</Text>

        {/* Weekly insight card */}
        <LinearGradient
          colors={COLORS.gradientAccent}
          style={styles.weeklyCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.weeklyTag}>🌟 WEEKLY REFLECTION</Text>
          <Text style={styles.weeklyQuote}>"You're building something real."</Text>
          <View style={styles.weeklyStats}>
            <Text style={styles.weeklyStatText}>{weeklyCount} kudos this week</Text>
            <Text style={styles.weeklyStatText}>📈</Text>
          </View>
        </LinearGradient>

        {/* Received */}
        {received.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Received</Text>
            {received.map(k => (
              <View key={k.id} style={[styles.kudoCard, !k.isRead && styles.kudoCardNew]}>
                <View style={styles.kudoIcon}>
                  <Text style={{ fontSize: 20 }}>💛</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.kudoRow}>
                    <Text style={styles.kudoFrom}>{k.fromUserName}</Text>
                    {!k.isRead && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>}
                  </View>
                  <Text style={styles.kudoReason}>Appreciated: "{k.triggeredByMessage}"</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Given */}
        {given.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>Given</Text>
            {given.map(k => (
              <View key={k.id} style={styles.kudoCardSimple}>
                <Text style={{ fontSize: 20 }}>💛</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.kudoFrom}>{k.fromUserName}</Text>
                  <Text style={styles.kudoReason}>"{k.triggeredByMessage}"</Text>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky Give Kudos button */}
      <View style={styles.stickyBtn}>
        <Button label="Give Kudos to someone  →" onPress={() => setShowGive(true)} />
      </View>

      <BottomSheet visible={showGive} onClose={() => setShowGive(false)} title="Give someone Kudos" height={440}>
        <View style={{ padding: SPACING.lg }}>
          <Text style={styles.sheetSubtitle}>They won't know how it was triggered — just that it came from you.</Text>
          <View style={{ gap: 12 }}>
            <View>
              <Text style={styles.fieldLabel}>Who are you appreciating?</Text>
              <TextInput
                style={styles.textField}
                placeholder="Name..."
                placeholderTextColor={COLORS.textMuted}
                value={recipientName}
                onChangeText={setRecipientName}
              />
            </View>
            <View>
              <Text style={styles.fieldLabel}>What did you appreciate?</Text>
              <TextInput
                style={[styles.textField, { minHeight: 90, textAlignVertical: 'top' }]}
                placeholder="Something real they did or said..."
                placeholderTextColor={COLORS.textMuted}
                value={kudoReason}
                onChangeText={setKudoReason}
                multiline
              />
            </View>
          </View>
          <Button label="Send Kudos 💛" onPress={giveKudo} loading={giving} disabled={!recipientName.trim() || !kudoReason.trim()} style={{ marginTop: SPACING.lg }} />
        </View>
      </BottomSheet>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: SPACING.lg },
  title: { ...FONT.display, color: COLORS.text, marginBottom: 4 },
  subtitle: { ...FONT.body, color: COLORS.textMuted, marginBottom: SPACING.lg },
  weeklyCard: {
    borderRadius: RADIUS.card, padding: SPACING.lg, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.borderAccent,
  },
  weeklyTag: { ...FONT.label, color: COLORS.accent, marginBottom: SPACING.sm },
  weeklyQuote: { fontSize: 20, fontWeight: '700', color: COLORS.text, fontStyle: 'italic', marginBottom: SPACING.md },
  weeklyStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weeklyStatText: { ...FONT.caption, color: COLORS.textBody },
  sectionLabel: { ...FONT.label, color: COLORS.textMuted, marginBottom: SPACING.sm },
  kudoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: 10,
    ...SHADOW.card,
  },
  kudoCardNew: { borderColor: COLORS.borderAccent },
  kudoCardSimple: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: 10,
  },
  kudoIcon: {
    width: SIZE.avatarSm, height: SIZE.avatarSm, borderRadius: SIZE.avatarSm / 2,
    backgroundColor: 'rgba(245,158,11,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  kudoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  kudoFrom: { ...FONT.bodyBold, color: COLORS.text },
  kudoReason: { ...FONT.caption, color: COLORS.textMuted, fontStyle: 'italic', lineHeight: 18 },
  newBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: RADIUS.sm,
    paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.borderAccent,
  },
  newBadgeText: { ...FONT.label, color: COLORS.accent, fontSize: 9 },
  stickyBtn: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.md, backgroundColor: COLORS.bg,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  sheetSubtitle: { ...FONT.caption, color: COLORS.textMuted, marginBottom: SPACING.lg },
  fieldLabel: { ...FONT.caption, color: COLORS.textMuted, marginBottom: 6 },
  textField: {
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, color: COLORS.text, fontSize: 15,
  },
});
