import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Input } from '../components/Input';
import { Avatar } from '../components/Avatar';
import { Toast } from '../components/Toast';
import { COLORS, FONT, RADIUS, SIZE, SPACING, SHADOW } from '../theme';
import { SettingsContext } from '../contexts/SettingsContext';

type Mode = 'support' | 'deep' | 'builder' | 'casual';
type Message = { id: string; text: string; sender: 'user' | 'ai' };

const MODES: { key: Mode; emoji: string; label: string; desc: string }[] = [
  { key: 'support',  emoji: '🤗', label: 'Support',  desc: 'Empathetic, warm, no advice unless asked' },
  { key: 'deep',     emoji: '🌊', label: 'Deep',     desc: 'Real questions, real answers, no surface talk' },
  { key: 'builder',  emoji: '🏗️', label: 'Builder',  desc: 'Tactical, focused on what you\'re building' },
  { key: 'casual',   emoji: '☕', label: 'Casual',   desc: 'Relaxed, no pressure, just talking' },
];

const QUICK_CHIPS = [
  'How am I doing?',
  'I need to talk.',
  'I\'m feeling stuck.',
  'Tell me something real.',
  'Who might I meet today?',
  'Help me think.',
];

function fetchWithTimeout(resource: RequestInfo, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 8000, ...rest } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, { ...rest, signal: controller.signal }).finally(() => clearTimeout(id));
}

export function ChatScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<Mode>('support');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as any });
  const [userName, setUserName] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await fetchWithTimeout(`${apiUrl}/api/chat/history`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await res.json();
        if (data.history?.length) {
          setMessages(data.history.map((m: any) => ({
            id: m.ts?.toString() || String(Date.now() + Math.random()),
            text: m.content,
            sender: m.role === 'assistant' ? 'ai' : 'user',
          })));
          if (data.userName) setUserName(data.userName);
        } else {
          setMessages([{ id: 'welcome', sender: 'ai', text: `Hey${userName ? ` ${userName}` : ''}. I've been thinking about what you might need today. What's on your mind?` }]);
        }
      } catch {
        setMessages([{ id: 'welcome', sender: 'ai', text: "Hey. I've been thinking about what you might need today. What's on your mind?" }]);
      }
    };
    if (userToken) loadHistory();
  }, [apiUrl, userToken]);

  const scrollToBottom = () => setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages(prev => [...prev, { id: String(Date.now()), text: msg, sender: 'user' }]);
    setInput('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const res = await fetchWithTimeout(`${apiUrl}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ message: msg, mode }),
      });
      const data = await res.json();
      if (data.reply) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessages(prev => [...prev, { id: String(Date.now()), text: data.reply, sender: 'ai' }]);
      }
    } catch {
      setMessages(prev => [...prev, { id: String(Date.now()), sender: 'ai', text: "I'm here. Even when the connection isn't. ❤️" }]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const switchMode = (m: Mode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(m);
    const label = MODES.find(x => x.key === m)?.label || m;
    setToast({ visible: true, message: `Switched to ${label} mode`, type: 'info' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top'] as any}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name="AI" size="sm" isCompanion isOnline />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.headerTitle}>Your Companion</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Always here</Text>
            </View>
          </View>
        </View>

        {/* Mode chips — horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeCips}
        >
          {MODES.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.modeChip, mode === m.key && styles.modeChipActive]}
              onPress={() => switchMode(m.key)}
              activeOpacity={0.75}
            >
              <Text style={styles.modeChipEmoji}>{m.emoji}</Text>
              <Text style={[styles.modeChipLabel, mode === m.key && { color: COLORS.text }]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          renderItem={({ item }) =>
            item.sender === 'user' ? (
              <LinearGradient
                colors={COLORS.gradientPrimary}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.bubble, styles.bubbleUser]}
              >
                <Text style={styles.bubbleText}>{item.text}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.aiRow}>
                <Avatar name="AI" size="xs" isCompanion />
                <View style={[styles.bubble, styles.bubbleAI]}>
                  <Text style={styles.bubbleText}>{item.text}</Text>
                </View>
              </View>
            )
          }
          ListFooterComponent={
            isTyping ? (
              <View style={styles.aiRow}>
                <Avatar name="AI" size="xs" isCompanion />
                <View style={[styles.bubble, styles.bubbleAI, styles.typingBubble]}>
                  <ActivityIndicator size="small" color={COLORS.textMuted} />
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickChipScroll}
          contentContainerStyle={styles.quickChipContent}
        >
          {QUICK_CHIPS.map(chip => (
            <TouchableOpacity
              key={chip}
              style={styles.quickChip}
              onPress={() => sendMessage(chip)}
              activeOpacity={0.75}
            >
              <Text style={styles.quickChipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <Input
            variant="chat"
            placeholder="Talk to your companion..."
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            containerStyle={{ flex: 1 }}
            returnKeyType="send"
            multiline={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isTyping) && { opacity: 0.4 }]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={COLORS.gradientPrimary}
              style={styles.sendBtnGrad}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.sendBtnText}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Toast
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
        onHide={() => setToast(t => ({ ...t, visible: false }))}
        duration={2000}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface1,
    paddingBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingTop: 14, marginBottom: 10,
  },
  headerTitle: { ...FONT.bodyBold, color: COLORS.text },
  onlineRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  onlineDot: {
    width: SIZE.onlineDotSm, height: SIZE.onlineDotSm,
    borderRadius: SIZE.onlineDotSm / 2,
    backgroundColor: COLORS.success,
    marginRight: 5,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  onlineText: { ...FONT.caption, color: COLORS.textMuted },
  modeCips: { paddingHorizontal: SPACING.md, gap: 8 },
  modeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, height: SIZE.chipMode,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.border,
  },
  modeChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(99,102,241,0.12)',
    ...SHADOW.glow,
  },
  modeChipEmoji: { fontSize: 13 },
  modeChipLabel: { ...FONT.caption, color: COLORS.textMuted, fontWeight: '600' },
  messageList: { padding: SPACING.md, paddingBottom: 8 },
  bubble: {
    maxWidth: '78%', padding: 14, borderRadius: RADIUS.card, marginBottom: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end', borderBottomRightRadius: 4,
  },
  bubbleAI: {
    alignSelf: 'flex-start', borderBottomLeftRadius: 4,
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.border,
    marginLeft: 8,
  },
  aiRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10 },
  typingBubble: { width: 64, height: 44, justifyContent: 'center', alignItems: 'center' },
  bubbleText: { ...FONT.body, color: COLORS.text },
  quickChipScroll: {
    borderTopWidth: 1, borderTopColor: COLORS.border, maxHeight: SIZE.chipQuick + 20,
  },
  quickChipContent: { paddingHorizontal: SPACING.md, paddingVertical: 10, gap: 8 },
  quickChip: {
    height: SIZE.chipQuick,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surface2,
    borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center',
  },
  quickChipText: { ...FONT.caption, color: COLORS.textBody, fontWeight: '500' },
  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 10,
    backgroundColor: COLORS.surface1,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    gap: 10,
  },
  sendBtn: { width: SIZE.btnIcon, height: SIZE.btnIcon },
  sendBtnGrad: {
    width: SIZE.btnIcon, height: SIZE.btnIcon,
    borderRadius: SIZE.btnIcon / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnText: { color: '#fff', fontWeight: '800', fontSize: 18 },
});
