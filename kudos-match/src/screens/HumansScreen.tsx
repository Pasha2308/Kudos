import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, Alert, ActivityIndicator, TextInput
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Avatar } from '../components/Avatar';
import { Button } from '../components/Button';
import { BottomSheet } from '../components/BottomSheet';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { COLORS, FONT, RADIUS, SIZE, SPACING, SHADOW } from '../theme';
import { SettingsContext } from '../contexts/SettingsContext';

interface Human {
  id: string;
  name: string;
  location?: string;
  personalityTags: string[];
  companionReason: string;
  isOnline: boolean;
}

const MOCK_HUMANS: Human[] = [
  { id: 'priya', name: 'Priya Sharma', location: 'Mumbai', personalityTags: ['Builder', 'Night owl', 'Design-minded'], companionReason: 'You both mentioned hating small talk. Priya also builds at night.', isOnline: true },
  { id: 'arjun', name: 'Arjun Kapoor', location: 'Delhi', personalityTags: ['Overthinker', 'Technical', 'Cofounder-minded'], companionReason: 'You both process life through long conversations and overthinking.', isOnline: true },
  { id: 'rahul', name: 'Rahul Mehta', location: 'Bangalore', personalityTags: ['Startup', 'Revenue-focused'], companionReason: "You're both obsessed with distribution and not just building.", isOnline: false },
];

export function HumansScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [humans, setHumans] = useState<Human[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedHuman, setSelectedHuman] = useState<Human | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });

  useEffect(() => {
    fetch(`${apiUrl}/api/humans/intros`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    })
      .then(r => r.json())
      .then(d => { if (d.intros?.length) setHumans(d.intros); else setHumans(MOCK_HUMANS); })
      .catch(() => setHumans(MOCK_HUMANS))
      .finally(() => setLoading(false));
  }, [apiUrl, userToken]);

  const filtered = humans
    .filter(h => !dismissed.has(h.id))
    .filter(h => h.name.toLowerCase().includes(search.toLowerCase()));

  const sendNote = async () => {
    if (!noteText.trim() || !selectedHuman) return;
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await fetch(`${apiUrl}/api/humans/${selectedHuman.id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ note: noteText, anonymous: isAnonymous, topic: selectedTopic }),
      });
    } catch (e) { /* non-blocking */ }
    setSending(false);
    setSelectedHuman(null);
    setNoteText('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToast({ visible: true, message: `Warm note sent to ${selectedHuman.name} 💌`, type: 'success' });
  };

  const topics = ['Work', 'Building', 'Life', 'Mental health', 'Idea', 'Feedback'];

  return (
    <SafeAreaView style={styles.container} edges={['top'] as any}>
      <View style={styles.content}>
        {/* Header */}
        <Text style={styles.title}>Humans</Text>
        <Text style={styles.subtitle}>Warm intros based on trust, not metrics.</Text>

        {/* Search */}
        <Input
          icon="🔍"
          placeholder="Search by name or vibe..."
          value={search}
          onChangeText={setSearch}
          containerStyle={{ marginBottom: SPACING.md }}
        />

        <Text style={styles.sectionLabel}>Suggested for you</Text>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>No intros yet.</Text>
                <Text style={styles.emptyText}>Your companion is still learning who might click.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                {/* Card header */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <Avatar name={item.name} size="md" isOnline={item.isOnline} />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.cardName}>{item.name}</Text>
                      {item.location && <Text style={styles.cardLocation}>📍 {item.location}</Text>}
                    </View>
                  </View>
                </View>

                {/* Companion insight box */}
                <View style={styles.insightBox}>
                  <Text style={styles.insightLabel}>🤖 Your companion says:</Text>
                  <Text style={styles.insightText}>"{item.companionReason}"</Text>
                </View>

                {/* Tags */}
                <View style={styles.tagsRow}>
                  {item.personalityTags.map(tag => (
                    <View key={tag} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>

                {/* Action buttons */}
                <View style={styles.cardActions}>
                  <Button
                    label="Send Note 💌"
                    onPress={() => { setSelectedHuman(item); setNoteText(''); }}
                    style={{ flex: 1 }}
                    height={44}
                  />
                  <TouchableOpacity
                    style={styles.dismissBtn}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDismissed(prev => new Set([...prev, item.id]));
                    }}
                  >
                    <Text style={styles.dismissText}>Not now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Send Note Bottom Sheet */}
      <BottomSheet
        visible={!!selectedHuman}
        onClose={() => setSelectedHuman(null)}
        title={`Send ${selectedHuman?.name?.split(' ')[0]} a warm note`}
        height={500}
      >
        <View style={styles.sheetContent}>
          <Text style={styles.sheetSubtitle}>This is private. No pressure.</Text>

          <TextInput
            style={styles.noteInput}
            placeholder="Write something honest..."
            placeholderTextColor={COLORS.textMuted}
            value={noteText}
            onChangeText={setNoteText}
            multiline
            maxLength={300}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{noteText.length}/300</Text>

          {/* Anonymous toggle */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => { setIsAnonymous(a => !a); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Text style={styles.toggleLabel}>👤 Keep anonymous</Text>
            <View style={[styles.togglePill, isAnonymous && styles.togglePillActive]}>
              <View style={[styles.toggleThumb, isAnonymous && styles.toggleThumbRight]} />
            </View>
          </TouchableOpacity>

          {/* Topics */}
          <Text style={styles.topicLabel}>Add a topic (optional)</Text>
          <View style={styles.topicsRow}>
            {topics.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.topicChip, selectedTopic === t && styles.topicChipActive]}
                onPress={() => { setSelectedTopic(selectedTopic === t ? '' : t); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              >
                <Text style={[styles.topicText, selectedTopic === t && { color: COLORS.primary }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button
            label="Send Warm Note 💌"
            onPress={sendNote}
            loading={sending}
            disabled={!noteText.trim()}
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      </BottomSheet>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: SPACING.lg },
  title: { ...FONT.display, color: COLORS.text, marginBottom: 6 },
  subtitle: { ...FONT.body, color: COLORS.textMuted, marginBottom: SPACING.lg },
  sectionLabel: { ...FONT.label, color: COLORS.textMuted, marginBottom: SPACING.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...FONT.h2, color: COLORS.text, marginBottom: 8 },
  emptyText: { ...FONT.body, color: COLORS.textMuted, textAlign: 'center' },
  card: {
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: SPACING.md,
    ...SHADOW.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  cardName: { ...FONT.h2, color: COLORS.text },
  cardLocation: { ...FONT.caption, color: COLORS.textMuted, marginTop: 2 },
  insightBox: {
    backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.20)',
    padding: 12, marginBottom: SPACING.sm,
  },
  insightLabel: { ...FONT.caption, color: COLORS.primary, fontWeight: '700', marginBottom: 4 },
  insightText: { ...FONT.caption, color: COLORS.textBody, fontStyle: 'italic', lineHeight: 18 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.md },
  tag: {
    backgroundColor: COLORS.surface2, borderRadius: RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 10, height: SIZE.chipTag, justifyContent: 'center',
  },
  tagText: { ...FONT.caption, color: COLORS.textMuted },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dismissBtn: { paddingHorizontal: 12, paddingVertical: 10 },
  dismissText: { ...FONT.caption, color: COLORS.textMuted },
  // Sheet styles
  sheetContent: { padding: SPACING.lg },
  sheetSubtitle: { ...FONT.caption, color: COLORS.textMuted, marginBottom: SPACING.md },
  noteInput: {
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, minHeight: 110,
    color: COLORS.text, fontSize: 15, lineHeight: 22,
  },
  charCount: { ...FONT.caption, color: COLORS.textMuted, textAlign: 'right', marginTop: 6, marginBottom: SPACING.md },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    height: SIZE.tapMin, borderTopWidth: 1, borderTopColor: COLORS.border,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  toggleLabel: { ...FONT.body, color: COLORS.text },
  togglePill: {
    width: 44, height: 26, borderRadius: 13,
    backgroundColor: COLORS.surface3, padding: 3,
  },
  togglePillActive: { backgroundColor: COLORS.primary },
  toggleThumb: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff',
  },
  toggleThumbRight: { marginLeft: 18 },
  topicLabel: { ...FONT.label, color: COLORS.textMuted, marginBottom: SPACING.sm },
  topicsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  topicChip: {
    paddingHorizontal: 14, height: SIZE.chipQuick,
    borderRadius: RADIUS.pill, justifyContent: 'center',
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  topicChipActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(99,102,241,0.08)' },
  topicText: { ...FONT.caption, color: COLORS.textMuted, fontWeight: '600' },
});
