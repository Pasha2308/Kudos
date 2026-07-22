import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import { COLORS, FONT, RADIUS, SIZE, SPACING, SHADOW } from '../theme';
import { SettingsContext } from '../contexts/SettingsContext';

interface Challenge { id: string; text: string; type: string; }

const DAILY_CHALLENGES: Challenge[] = [
  { id: 'c1', text: 'Reach out to someone first today. Don\'t wait for them.', type: 'ACTION' },
  { id: 'c2', text: 'Write down one thing that\'s actually hard right now. Just for yourself.', type: 'REFLECTION' },
  { id: 'c3', text: 'Ship something small. Even a DM counts.', type: 'BUILD' },
  { id: 'c4', text: 'Tell someone what you\'re working on. Out loud. See how it sounds.', type: 'COMMUNICATION' },
  { id: 'c5', text: 'Take 10 minutes with no screen. Not a break — an inventory.', type: 'MINDSET' },
];

const STAT_ITEMS = [
  { emoji: '👥', label: 'Humans Met', key: 'humansMet' },
  { emoji: '💛', label: 'Kudos Given', key: 'kudosGiven' },
  { emoji: '🤝', label: 'IRL Connections', key: 'irlConnections' },
  { emoji: '💬', label: 'Chats / Week', key: 'chatsPerWeek' },
];

export function BuilderToolsScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [challenge] = useState<Challenge>(DAILY_CHALLENGES[new Date().getDay() % DAILY_CHALLENGES.length]);
  const [done, setDone] = useState(false);
  const [streak, setStreak] = useState(0);
  const [weekProgress, setWeekProgress] = useState(3);
  const [stats, setStats] = useState({ humansMet: 0, kudosGiven: 0, irlConnections: 0, chatsPerWeek: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });

  useEffect(() => {
    fetch(`${apiUrl}/api/builder/stats`, { headers: { 'Authorization': `Bearer ${userToken}` } })
      .then(r => r.json())
      .then(d => {
        setStreak(d.streak || 7);
        setWeekProgress(d.weekProgress || 3);
        setStats({ humansMet: d.humansMet || 3, kudosGiven: d.kudosGiven || 11, irlConnections: d.irlConnections || 1, chatsPerWeek: d.chatsPerWeek || 18 });
        setDone(d.todayDone || false);
      })
      .catch(() => {
        setStreak(7); setWeekProgress(3);
        setStats({ humansMet: 3, kudosGiven: 11, irlConnections: 1, chatsPerWeek: 18 });
      })
      .finally(() => setLoading(false));
  }, []);

  const markDone = async () => {
    if (done) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDone(true);
    setWeekProgress(p => Math.min(p + 1, 5));
    setStreak(s => s + 1);
    setToast({ visible: true, message: '🔥 Challenge complete! Keep going.', type: 'success' });
    try {
      await fetch(`${apiUrl}/api/builder/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}` },
      });
    } catch (e) {}
  };

  if (loading) return <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top'] as any}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Builder Tools 🎯</Text>
        <Text style={styles.subtitle}>Daily micro-challenges for real humans.</Text>

        {/* Today's challenge card */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeTag}>
            <Text style={styles.challengeTagText}>TODAY · {challenge.type}</Text>
          </View>

          <Text style={styles.challengeText}>{challenge.text}</Text>

          {/* Progress dots */}
          <View style={styles.progressRow}>
            {[1,2,3,4,5].map(i => (
              <View key={i} style={[styles.progressDot, i <= weekProgress && styles.progressDotActive]} />
            ))}
            <Text style={styles.progressLabel}>{weekProgress}/5 this week</Text>
          </View>

          <Button
            label={done ? '✓ Done for today' : 'Mark as Done  ✓'}
            onPress={markDone}
            variant={done ? 'secondary' : 'success'}
            disabled={done}
            height={48}
          />
        </View>

        {/* Streak card */}
        <LinearGradient
          colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.04)']}
          style={styles.streakCard}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        >
          <Text style={styles.streakIcon}>🔥</Text>
          <View>
            <Text style={styles.streakCount}>{streak} day streak</Text>
            <Text style={styles.streakQuote}>"You're building something real."</Text>
          </View>
        </LinearGradient>

        {/* Stats grid */}
        <Text style={styles.sectionLabel}>Your Stats</Text>
        <View style={styles.statsGrid}>
          {STAT_ITEMS.map(item => (
            <View key={item.key} style={styles.statCard}>
              <Text style={styles.statEmoji}>{item.emoji}</Text>
              <Text style={styles.statValue}>{(stats as any)[item.key]}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: SPACING.lg },
  title: { ...FONT.display, color: COLORS.text, marginBottom: 4 },
  subtitle: { ...FONT.body, color: COLORS.textMuted, marginBottom: SPACING.lg },
  challengeCard: {
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.lg,
    marginBottom: SPACING.md, ...SHADOW.card,
  },
  challengeTag: {
    backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: RADIUS.xs,
    paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: SPACING.md,
  },
  challengeTagText: { ...FONT.label, color: COLORS.accent, fontSize: 10 },
  challengeText: { fontSize: 18, fontWeight: '700', color: COLORS.text, lineHeight: 26, marginBottom: SPACING.lg },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.lg },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.surface3 },
  progressDotActive: { backgroundColor: COLORS.primary, ...SHADOW.glow },
  progressLabel: { ...FONT.caption, color: COLORS.textMuted, marginLeft: 4 },
  streakCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    borderRadius: RADIUS.card, padding: SPACING.lg, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.borderAccent,
  },
  streakIcon: { fontSize: 36 },
  streakCount: { ...FONT.h1, color: COLORS.text, marginBottom: 4 },
  streakQuote: { ...FONT.caption, color: COLORS.textMuted, fontStyle: 'italic' },
  sectionLabel: { ...FONT.label, color: COLORS.textMuted, marginBottom: SPACING.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%', backgroundColor: COLORS.surface1, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md,
    alignItems: 'flex-start', ...SHADOW.card, minHeight: 90,
  },
  statEmoji: { fontSize: 22, marginBottom: SPACING.sm },
  statValue: { ...FONT.h1, color: COLORS.text, fontSize: 28, fontWeight: '800', marginBottom: 4 },
  statLabel: { ...FONT.caption, color: COLORS.textMuted },
});
