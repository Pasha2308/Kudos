import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Avatar } from '../components/Avatar';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { COLORS, FONT, RADIUS, SIZE, SPACING, SHADOW } from '../theme';
import { SettingsContext } from '../contexts/SettingsContext';

// Safe date formatting (works even if date-fns not yet installed)
const formatAgo = (date: any): string => {
  try {
    const { formatDistanceToNow } = require('date-fns');
    return formatDistanceToNow(new Date(date), { addSuffix: false });
  } catch {
    const ms = Date.now() - new Date(date).getTime();
    const h = Math.floor(ms / 3600000);
    if (h < 1) return 'just now';
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }
};


interface Conversation { id: string; participantName: string; participantId: string; lastMessage: string; lastMessageAt: any; unread: number; isOnline: boolean; }
interface Message { id: string; senderId: string; content: string; timestamp: any; }

const MOCK_CONVOS: Conversation[] = [
  { id: 'c1', participantName: 'Priya Sharma', participantId: 'priya', lastMessage: "Yeah I shipped at 2am too haha", lastMessageAt: new Date(Date.now() - 3600000), unread: 2, isOnline: true },
  { id: 'c2', participantName: 'Arjun Kapoor', participantId: 'arjun', lastMessage: "You sent a warm note", lastMessageAt: new Date(Date.now() - 10800000), unread: 0, isOnline: false },
];

export function DMsScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`${apiUrl}/api/dm`, { headers: { 'Authorization': `Bearer ${userToken}` } })
      .then(r => r.json())
      .then(d => setConversations(d.conversations?.length ? d.conversations : MOCK_CONVOS))
      .catch(() => setConversations(MOCK_CONVOS))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeConvo) return;
    fetch(`${apiUrl}/api/dm/${activeConvo.participantId}/messages`, { headers: { 'Authorization': `Bearer ${userToken}` } })
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => setMessages([
        { id: '1', senderId: activeConvo.participantId, content: activeConvo.lastMessage, timestamp: activeConvo.lastMessageAt },
      ]));
  }, [activeConvo]);

  const sendMsg = async () => {
    if (!input.trim() || !activeConvo || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages(prev => [...prev, { id: String(Date.now()), senderId: 'me', content: text, timestamp: new Date() }]);
    try {
      await fetch(`${apiUrl}/api/dm/${activeConvo.participantId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ content: text }),
      });
    } catch (e) {}
    setSending(false);
  };

  // DM Thread view
  if (activeConvo) {
    return (
      <SafeAreaView style={styles.container} edges={['top'] as any}>
        <View style={styles.dmHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setActiveConvo(null)}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Avatar name={activeConvo.participantName} size="xs" isOnline={activeConvo.isOnline} />
          <View>
            <Text style={styles.dmHeaderName}>{activeConvo.participantName}</Text>
            <Text style={styles.dmHeaderStatus}>{activeConvo.isOnline ? '● Online' : 'Offline'}</Text>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: SPACING.md }}
            renderItem={({ item }) => {
              const isMe = item.senderId === 'me';
              return (
                <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                  <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
                    <Text style={styles.msgText}>{item.content}</Text>
                  </View>
                </View>
              );
            }}
          />
          <View style={styles.inputBar}>
            <Input variant="chat" placeholder="Say something..." value={input} onChangeText={setInput} onSubmitEditing={sendMsg} returnKeyType="send" containerStyle={{ flex: 1 }} />
            <TouchableOpacity style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]} onPress={sendMsg} disabled={!input.trim() || sending}>
              <Text style={styles.sendBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top'] as any}>
      <View style={styles.content}>
        <Text style={styles.title}>Direct Messages</Text>
        <Text style={styles.subtitle}>Your conversations with humans.</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✉️</Text>
                <Text style={styles.emptyTitle}>No conversations yet.</Text>
                <Text style={styles.emptyText}>Connect with someone in Humans first.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.convoRow}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveConvo(item); }}
                activeOpacity={0.8}
              >
                <Avatar name={item.participantName} size="md" isOnline={item.isOnline} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.convoName}>{item.participantName}</Text>
                  <Text style={styles.convoLast} numberOfLines={1}>{item.lastMessage}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={styles.convoTime}>
                    {formatAgo(item.lastMessageAt)}
                  </Text>
                  {item.unread > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{item.unread}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: SPACING.lg },
  title: { ...FONT.display, color: COLORS.text, marginBottom: 4 },
  subtitle: { ...FONT.body, color: COLORS.textMuted, marginBottom: SPACING.lg },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { ...FONT.h2, color: COLORS.text, marginBottom: 8 },
  emptyText: { ...FONT.body, color: COLORS.textMuted, textAlign: 'center' },
  convoRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: 10,
    height: 72,
    ...SHADOW.card,
  },
  convoName: { ...FONT.bodyBold, color: COLORS.text, marginBottom: 2 },
  convoLast: { ...FONT.caption, color: COLORS.textMuted },
  convoTime: { ...FONT.caption, color: COLORS.textMuted, fontSize: 11 },
  unreadBadge: {
    backgroundColor: COLORS.primary, borderRadius: SIZE.badgeMin / 2,
    minWidth: SIZE.badgeMin, height: SIZE.badgeMin,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { ...FONT.label, color: '#fff', fontSize: 10 },
  // DM chat
  dmHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface1,
  },
  backBtn: { width: SIZE.tapMin, height: SIZE.tapMin, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: COLORS.text },
  dmHeaderName: { ...FONT.bodyBold, color: COLORS.text },
  dmHeaderStatus: { ...FONT.caption, color: COLORS.textMuted, marginTop: 2 },
  msgRow: { flexDirection: 'row', marginBottom: 10 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgBubble: {
    maxWidth: '78%', backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.card, borderWidth: 1, borderColor: COLORS.border,
    padding: 12, borderBottomLeftRadius: 4,
  },
  msgBubbleMe: {
    backgroundColor: COLORS.primary, borderColor: 'transparent',
    borderBottomLeftRadius: RADIUS.card, borderBottomRightRadius: 4,
  },
  msgText: { ...FONT.body, color: COLORS.text },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface1,
  },
  sendBtn: {
    width: SIZE.btnIcon, height: SIZE.btnIcon, borderRadius: SIZE.btnIcon / 2,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    ...SHADOW.glow,
  },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
