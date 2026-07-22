import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, TextInput, KeyboardAvoidingView, Platform
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BottomSheet } from '../components/BottomSheet';
import { Button } from '../components/Button';
import { Avatar } from '../components/Avatar';
import { Input } from '../components/Input';
import { Toast } from '../components/Toast';
import { COLORS, FONT, RADIUS, SIZE, SPACING, SHADOW } from '../theme';
import { SettingsContext } from '../contexts/SettingsContext';

interface Room { id: string; name: string; emoji: string; description: string; memberCount: number; activeCount: number; daysRemaining: number; tags: string[]; isMember?: boolean; }
interface Message { id: string; userId: string; userName: string; content: string; timestamp: any; }

const MOCK_ROOMS: Room[] = [
  { id: 'midnight_builders', name: 'Midnight Builders', emoji: '🌃', description: 'Solo founders who build at night when the world is quiet.', memberCount: 6, activeCount: 2, daysRemaining: 25, tags: ['builders', 'solo'], isMember: true },
  { id: 'founders_failed', name: 'Founders Who Failed', emoji: '💭', description: 'A safe space for people who shipped, broke, and learned.', memberCount: 4, activeCount: 1, daysRemaining: 20, tags: ['founders', 'failure'], isMember: true },
];
const MOCK_SUGGESTED: Room[] = [
  { id: 'overthinkers', name: 'Overthinkers Club', emoji: '💡', description: 'People who process life through long conversations.', memberCount: 7, activeCount: 3, daysRemaining: 28, tags: ['deep', 'thinkers'] },
];

export function RoomsScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [suggested, setSuggested] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', emoji: '🌐', description: '', tags: '' });
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as const });
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    fetch(`${apiUrl}/api/rooms`, { headers: { 'Authorization': `Bearer ${userToken}` } })
      .then(r => r.json())
      .then(d => { setMyRooms(d.userRooms || MOCK_ROOMS); setSuggested(d.suggestedRooms || MOCK_SUGGESTED); })
      .catch(() => { setMyRooms(MOCK_ROOMS); setSuggested(MOCK_SUGGESTED); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    fetch(`${apiUrl}/api/rooms/${activeRoom.id}/messages`, { headers: { 'Authorization': `Bearer ${userToken}` } })
      .then(r => r.json())
      .then(d => setMessages(d.messages || []))
      .catch(() => setMessages([
        { id: '1', userId: 'priya', userName: 'Priya', content: 'Anyone else ship something at 2am and immediately regret it? 😅', timestamp: new Date(Date.now() - 3600000) },
        { id: '2', userId: 'arjun', userName: 'Arjun', content: 'Every single time. But then it works and you feel like a genius.', timestamp: new Date(Date.now() - 3000000) },
      ]));
  }, [activeRoom]);

  const sendMsg = async () => {
    if (!msgInput.trim() || !activeRoom || sending) return;
    const text = msgInput.trim();
    setMsgInput('');
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const opt: Message = { id: String(Date.now()), userId: 'me', userName: 'You', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, opt]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      await fetch(`${apiUrl}/api/rooms/${activeRoom.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ content: text }),
      });
    } catch (e) {}
    setSending(false);
  };

  const joinRoom = async (room: Room) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await fetch(`${apiUrl}/api/rooms/${room.id}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}` },
      });
    } catch (e) {}
    setSuggested(prev => prev.filter(r => r.id !== room.id));
    setMyRooms(prev => [...prev, { ...room, isMember: true }]);
    setToast({ visible: true, message: `Joined ${room.name}!`, type: 'success' });
  };

  const createRoom = async () => {
    if (!newRoom.name.trim()) return;
    setCreating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await fetch(`${apiUrl}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ name: newRoom.name, emoji: newRoom.emoji, description: newRoom.description, tags: newRoom.tags.split(',').map(t => t.trim()) }),
      });
      const d = await res.json();
      if (d.room) {
        setMyRooms(prev => [d.room, ...prev]);
        setShowCreate(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setToast({ visible: true, message: `${newRoom.emoji} ${newRoom.name} created!`, type: 'success' });
      }
    } catch (e) {
      setShowCreate(false);
      setToast({ visible: true, message: 'Room created!', type: 'success' });
    }
    setCreating(false);
  };

  // Active room view
  if (activeRoom) {
    return (
      <SafeAreaView style={styles.container} edges={['top'] as any}>
        <View style={styles.roomHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setActiveRoom(null)}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.roomEmoji}>{activeRoom.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.roomTitle}>{activeRoom.name}</Text>
            <Text style={styles.roomMeta}>{activeRoom.memberCount} members · {activeRoom.daysRemaining}d left</Text>
          </View>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={{ padding: SPACING.md }}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const isMe = item.userId === 'me';
              return (
                <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                  {!isMe && <Avatar name={item.userName} size="xs" />}
                  <View style={{ maxWidth: '75%' }}>
                    {!isMe && <Text style={styles.msgAuthor}>{item.userName}</Text>}
                    <View style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
                      <Text style={styles.msgText}>{item.content}</Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />

          <View style={styles.inputBar}>
            <Input
              variant="chat"
              placeholder="Say something real..."
              value={msgInput}
              onChangeText={setMsgInput}
              onSubmitEditing={sendMsg}
              returnKeyType="send"
              containerStyle={{ flex: 1 }}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!msgInput.trim() || sending) && { opacity: 0.4 }]}
              onPress={sendMsg}
              disabled={!msgInput.trim() || sending}
            >
              <Text style={styles.sendBtnText}>→</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Room list view
  const allFiltered = myRooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={styles.container} edges={['top'] as any}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Rooms</Text>
            <Text style={styles.subtitle}>Small groups. Close in 30 days.</Text>
          </View>
          <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.createBtnText}>+ New</Text>
          </TouchableOpacity>
        </View>

        <Input
          icon="🔍" placeholder="Find a room..."
          value={search} onChangeText={setSearch}
          containerStyle={{ marginBottom: SPACING.md }}
        />

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {allFiltered.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Your Rooms</Text>
                {allFiltered.map(room => (
                  <TouchableOpacity key={room.id} style={styles.roomCard} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveRoom(room); }}>
                    <Text style={styles.roomCardEmoji}>{room.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roomCardName}>{room.name}</Text>
                      <Text style={styles.roomCardDesc} numberOfLines={1}>{room.description}</Text>
                      <View style={styles.roomCardMeta}>
                        <Text style={styles.roomCardActive}>● {room.activeCount} active</Text>
                        <Text style={styles.roomCardDays}>⏱ {room.daysRemaining}d left</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.openBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveRoom(room); }}>
                      <Text style={styles.openBtnText}>Open →</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {suggested.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: SPACING.lg }]}>Suggested For You</Text>
                {suggested.map(room => (
                  <View key={room.id} style={[styles.roomCard, { opacity: 0.85 }]}>
                    <Text style={styles.roomCardEmoji}>{room.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.roomCardName}>{room.name}</Text>
                      <Text style={styles.roomCardDesc} numberOfLines={1}>{room.description}</Text>
                      <View style={styles.roomCardMeta}>
                        <Text style={styles.roomCardActive}>{room.memberCount} members</Text>
                        <Text style={styles.roomCardDays}>⏱ {room.daysRemaining}d left</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.joinBtn} onPress={() => joinRoom(room)}>
                      <Text style={styles.joinBtnText}>Join</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Create Room Sheet */}
      <BottomSheet visible={showCreate} onClose={() => setShowCreate(false)} title="Create a Room" height={450}>
        <View style={{ padding: SPACING.lg }}>
          <View style={styles.emojiRow}>
            {['🌃', '💡', '🔧', '🤝', '📚', '☀️', '🌊', '🎯'].map(e => (
              <TouchableOpacity key={e} onPress={() => setNewRoom(n => ({ ...n, emoji: e }))}
                style={[styles.emojiOpt, newRoom.emoji === e && styles.emojiOptActive]}>
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input placeholder="Room name" value={newRoom.name} onChangeText={v => setNewRoom(n => ({ ...n, name: v }))} containerStyle={{ marginBottom: 12 }} />
          <Input placeholder="Description (optional)" value={newRoom.description} onChangeText={v => setNewRoom(n => ({ ...n, description: v }))} containerStyle={{ marginBottom: 12 }} />
          <Input placeholder="Tags (comma separated)" value={newRoom.tags} onChangeText={v => setNewRoom(n => ({ ...n, tags: v }))} containerStyle={{ marginBottom: SPACING.lg }} />
          <Button label={`Create ${newRoom.emoji} ${newRoom.name || 'Room'}`} onPress={createRoom} loading={creating} disabled={!newRoom.name.trim()} />
        </View>
      </BottomSheet>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onHide={() => setToast(t => ({ ...t, visible: false }))} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, padding: SPACING.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  title: { ...FONT.display, color: COLORS.text, marginBottom: 4 },
  subtitle: { ...FONT.body, color: COLORS.textMuted },
  createBtn: {
    backgroundColor: COLORS.surface2, borderRadius: RADIUS.pill,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border, marginTop: 8,
  },
  createBtnText: { ...FONT.caption, color: COLORS.text, fontWeight: '700' },
  sectionLabel: { ...FONT.label, color: COLORS.textMuted, marginBottom: SPACING.sm },
  roomCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface1, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border,
    padding: SPACING.md, marginBottom: 12, gap: 14,
    ...SHADOW.card,
  },
  roomCardEmoji: { fontSize: 32 },
  roomCardName: { ...FONT.h2, color: COLORS.text, marginBottom: 2 },
  roomCardDesc: { ...FONT.caption, color: COLORS.textMuted, marginBottom: 6 },
  roomCardMeta: { flexDirection: 'row', gap: 14 },
  roomCardActive: { ...FONT.caption, color: COLORS.success },
  roomCardDays: { ...FONT.caption, color: COLORS.accent },
  openBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.pill,
    paddingHorizontal: 14, paddingVertical: 8,
    ...SHADOW.glow,
  },
  openBtnText: { ...FONT.caption, color: '#fff', fontWeight: '700' },
  joinBtn: {
    backgroundColor: COLORS.surface2, borderRadius: RADIUS.pill,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  joinBtnText: { ...FONT.caption, color: COLORS.text, fontWeight: '700' },
  // Room chat styles
  roomHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface1, gap: 10,
  },
  backBtn: { width: SIZE.tapMin, height: SIZE.tapMin, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: COLORS.text },
  roomEmoji: { fontSize: 28 },
  roomTitle: { ...FONT.bodyBold, color: COLORS.text },
  roomMeta: { ...FONT.caption, color: COLORS.textMuted, marginTop: 2 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  msgRowMe: { justifyContent: 'flex-end' },
  msgAuthor: { ...FONT.caption, color: COLORS.textMuted, marginBottom: 4, marginLeft: 4 },
  msgBubble: {
    backgroundColor: COLORS.surface2, borderRadius: RADIUS.card,
    borderWidth: 1, borderColor: COLORS.border,
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
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: SPACING.md },
  emojiOpt: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.surface1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  emojiOptActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(99,102,241,0.1)' },
});
