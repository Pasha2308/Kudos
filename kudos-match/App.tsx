import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsContext = createContext<{
  apiUrl: string, 
  setApiUrl: (url: string) => void,
  userToken: string | null,
  setUserToken: (token: string | null) => void
}>({
  apiUrl: 'http://192.168.1.8:8080',
  setApiUrl: () => {},
  userToken: null,
  setUserToken: () => {}
});

const fetchWithTimeout = async (resource: RequestInfo, options: RequestInit & { timeout?: number } = {}) => {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
};

const Tab = createBottomTabNavigator();

const THEME = {
  bg: '#07070f',
  surface: '#0f0f1a',
  surface2: '#161626',
  primary: '#6366f1',
  secondary: '#a855f7',
  accent: '#f59e0b',
  success: '#22c55e',
  text: '#ffffff',
  textMuted: '#6b7280',
  border: 'rgba(255,255,255,0.07)'
};

// --- SCREENS ---

function ChatScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [messages, setMessages] = useState<{id: string, text: string, sender: 'user'|'ai'}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<'support'|'deep'|'builder'|'casual'>('support');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetchWithTimeout(`${apiUrl}/api/chat/history`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await res.json();
        if (data.history?.length) {
          const formatted = data.history.map((msg: any) => ({
            id: msg.ts?.toString() || Date.now().toString() + Math.random(),
            text: msg.content,
            sender: msg.role === 'assistant' ? 'ai' : 'user'
          }));
          setMessages(formatted);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 300);
        } else {
          setMessages([{ id: 'welcome', text: 'Hey friend. I\'ve been thinking about what you might need today. What\'s on your mind?', sender: 'ai' }]);
        }
      } catch (err) {
        setMessages([{ id: 'welcome', text: 'Hey friend. I\'ve been thinking about what you might need today. What\'s on your mind?', sender: 'ai' }]);
      }
    };
    fetchHistory();
  }, [apiUrl, userToken]);

  const scrollToBottom = () => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const currentInput = input.trim();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessages(prev => [...prev, { id: Date.now().toString(), text: currentInput, sender: 'user' }]);
    setInput('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const res = await fetchWithTimeout(`${apiUrl}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
        body: JSON.stringify({ message: currentInput, mode })
      });
      const data = await res.json();
      if (data.reply) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setMessages(prev => [...prev, { id: Date.now().toString(), text: data.reply, sender: 'ai' }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: 'I am here. Even when my connection isn\'t. ❤️', sender: 'ai' }]);
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerText}>Your Companion</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(['support', 'deep', 'builder', 'casual'] as const).map(m => (
              <TouchableOpacity key={m} onPress={() => setMode(m)} style={[styles.modeBtn, mode === m && styles.modeBtnActive]}>
                <Text style={{ color: mode === m ? THEME.text : THEME.textMuted, fontSize: 12, fontWeight: 'bold' }}>{m.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
          renderItem={({ item }) => (
            item.sender === 'user' ? (
              <LinearGradient colors={[THEME.primary, THEME.secondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.messageBubble, styles.msgUser]}>
                <Text style={styles.messageText}>{item.text}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.messageBubble, styles.msgAI]}>
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            )
          )}
          ListFooterComponent={
            isTyping ? <View style={[styles.messageBubble, styles.msgAI, { width: 60, padding: 12, height: 42, justifyContent: 'center' }]}><ActivityIndicator size="small" color={THEME.textMuted} /></View> : null
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Talk to your companion..."
            placeholderTextColor={THEME.textMuted}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={[styles.sendBtn, (!input.trim() || isTyping) && { opacity: 0.5 }]} onPress={sendMessage} disabled={!input.trim() || isTyping}>
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HumansScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [intros, setIntros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIntros = async () => {
      try {
        const res = await fetchWithTimeout(`${apiUrl}/api/humans/intros`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await res.json();
        if (data.intros?.length) setIntros(data.intros);
        else throw new Error('No intros');
      } catch (err) {
        setIntros([
          { id: 'mock_priya', name: 'Priya Sharma', location: 'Mumbai', personalityTags: ['Builder', 'Night owl'], companionReason: 'You both mentioned hating small talk. Priya also builds at night.', isOnline: true },
          { id: 'mock_arjun', name: 'Arjun Kapoor', location: 'Delhi', personalityTags: ['Overthinker', 'Technical'], companionReason: 'You both process life through long conversations.', isOnline: true },
        ]);
      } finally { setLoading(false); }
    };
    fetchIntros();
  }, [apiUrl, userToken]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Humans</Text>
        <Text style={styles.subtitle}>Warm intros based on trust, not metrics.</Text>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={THEME.primary} size="large" /></View>
        ) : (
          <FlatList
            data={intros}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {item.isOnline && <View style={[styles.onlineDot, { shadowColor: 'transparent' }]} />}
                </View>
                <View style={{ backgroundColor: 'rgba(14,165,233,0.1)', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  <Text style={{ color: '#0ea5e9', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Your companion says:</Text>
                  <Text style={{ color: THEME.text, fontStyle: 'italic' }}>"{item.companionReason}"</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {item.personalityTags.map((tag: string) => (
                    <View key={tag} style={{ backgroundColor: THEME.surface2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: THEME.border }}>
                      <Text style={{ color: THEME.textMuted, fontSize: 12 }}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: THEME.primary, paddingVertical: 12 }]} onPress={() => Alert.alert('Send Note', 'This will open a modal to send a note.')}>
                  <Text style={styles.primaryBtnText}>Send a warm note</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function RoomsScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetchWithTimeout(`${apiUrl}/api/rooms`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await res.json();
        if (data.userRooms?.length) setRooms(data.userRooms);
        else throw new Error('No rooms');
      } catch (err) {
        setRooms([
          { id: 'room_midnight_builders', name: 'Midnight Builders', emoji: '🌙', description: 'Solo founders who build at night.', activeCount: 2, daysRemaining: 25 },
          { id: 'room_overthinkers', name: 'Overthinkers Club', emoji: '💭', description: 'People who process life through long conversations.', activeCount: 3, daysRemaining: 28 },
        ]);
      } finally { setLoading(false); }
    };
    fetchRooms();
  }, [apiUrl, userToken]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={styles.title}>Rooms</Text>
          <TouchableOpacity style={{ backgroundColor: THEME.surface2, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: THEME.border }}>
            <Text style={{ color: THEME.text, fontSize: 12, fontWeight: 'bold' }}>+ New</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>Small group spaces. Closes in 30 days.</Text>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={THEME.primary} size="large" /></View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 16 }]} onPress={() => Alert.alert('Enter Room', 'Navigating to room chat...')}>
                <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.infoText}>{item.description}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <Text style={{ color: THEME.success, fontSize: 12 }}>{item.activeCount} active</Text>
                    <Text style={{ color: THEME.accent, fontSize: 12 }}>{item.daysRemaining}d left</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function KudosScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [kudos, setKudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKudos = async () => {
      try {
        const res = await fetchWithTimeout(`${apiUrl}/api/kudos/received`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await res.json();
        if (data.kudos?.length) setKudos(data.kudos);
        else throw new Error('No kudos');
      } catch (err) {
        setKudos([
          { id: 'mock_1', fromUserName: 'Priya', triggeredByMessage: "That I'm not always okay when I say I am.", isRead: false },
        ]);
      } finally { setLoading(false); }
    };
    fetchKudos();
  }, [apiUrl, userToken]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Kudos Moments 💛</Text>
        <Text style={styles.subtitle}>Private appreciation. Not a like button.</Text>

        <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(236,72,153,0.1)']} style={[styles.card, { borderColor: 'rgba(245,158,11,0.3)' }]}>
          <Text style={{ color: THEME.accent, fontWeight: 'bold', marginBottom: 8 }}>Weekly Reflection</Text>
          <Text style={{ color: THEME.text, fontSize: 18, fontWeight: 'bold' }}>"You're building something real."</Text>
        </LinearGradient>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={THEME.primary} size="large" /></View>
        ) : (
          <FlatList
            data={kudos}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[styles.card, { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderColor: item.isRead ? THEME.border : 'rgba(245,158,11,0.3)' }]}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>💛</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: 'bold', color: THEME.text }}>{item.fromUserName}</Text>
                    {!item.isRead && <Text style={{ color: THEME.accent, fontSize: 12, fontWeight: 'bold' }}>New</Text>}
                  </View>
                  <Text style={{ color: THEME.textMuted, fontStyle: 'italic', marginTop: 4 }}>Appreciated: "{item.triggeredByMessage}"</Text>
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function ProfileScreen() {
  const { userToken, setUserToken } = useContext(SettingsContext);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('@kudos_token');
    setUserToken(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Your connection health.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Anti-Loneliness Score</Text>
          <View style={{ alignItems: 'center', marginVertical: 24 }}>
            <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 8, borderColor: THEME.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: 'bold', color: THEME.text }}>74</Text>
            </View>
            <Text style={{ color: THEME.textMuted, marginTop: 12 }}>Growing</Text>
          </View>
          <Text style={{ color: THEME.text, textAlign: 'center', fontStyle: 'italic' }}>You're building something real.</Text>
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Builder Profile</Text>
          <Text style={styles.infoText}>Available on Kudos Web Dashboard.</Text>
        </View>

        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#ef4444', marginTop: 24 }]} onPress={handleLogout}>
          <Text style={styles.primaryBtnText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- APP ENTRY ---

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const { apiUrl } = useContext(SettingsContext);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(true);

  const handleAuth = async () => {
    if (!email) return;
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const uid = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const token = `mock_token_${uid}`;
      
      const res = await fetchWithTimeout(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email, name: name || uid })
      });
      
      if (res.ok) {
        await AsyncStorage.setItem('@kudos_token', token);
        onLogin(token);
      } else {
        Alert.alert('Error', 'Authentication failed');
      }
    } catch (err) {
      // Allow bypass in dev
      const uid = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const token = `mock_token_${uid}`;
      await AsyncStorage.setItem('@kudos_token', token);
      onLogin(token);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.center} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ width: '85%', maxWidth: 400 }}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: THEME.primary, marginBottom: 16 }} />
            <Text style={[styles.title, { textAlign: 'center' }]}>Kudos</Text>
            <Text style={[styles.subtitle, { textAlign: 'center' }]}>Stop being lonely. Start being real.</Text>
          </View>
          
          <View style={styles.card}>
            {isSignup && (
              <TextInput style={styles.input} placeholder="What should I call you?" placeholderTextColor={THEME.textMuted} value={name} onChangeText={setName} />
            )}
            <TextInput style={[styles.input, { marginTop: 16 }]} placeholder="Email address" placeholderTextColor={THEME.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: THEME.primary, marginTop: 24 }]} onPress={handleAuth} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{isSignup ? 'Start for Free' : 'Log In'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 24, padding: 12 }} onPress={() => setIsSignup(!isSignup)}>
              <Text style={{ color: THEME.textMuted, textAlign: 'center' }}>{isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  const [apiUrl, setApiUrl] = useState('http://localhost:8080'); // Adjust to your local IP if testing on physical device
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await AsyncStorage.getItem('@kudos_token');
        if (token) setUserToken(token);
      } catch (e) {} finally { setIsReady(true); }
    };
    loadSession();
  }, []);

  if (!isReady) return <View style={styles.center}><ActivityIndicator size="large" color={THEME.primary} /></View>;

  return (
    <SafeAreaProvider>
      <SettingsContext.Provider value={{ apiUrl, setApiUrl, userToken, setUserToken }}>
        {userToken ? (
          <NavigationContainer theme={DarkTheme}>
            <Tab.Navigator
              screenOptions={{
                headerShown: false,
                tabBarStyle: { backgroundColor: THEME.bg, borderTopColor: THEME.border, height: 60, paddingBottom: 8, paddingTop: 8 },
                tabBarActiveTintColor: THEME.primary,
                tabBarInactiveTintColor: THEME.textMuted
              }}
            >
              <Tab.Screen name="Chat" component={ChatScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>💬</Text> }} />
              <Tab.Screen name="Humans" component={HumansScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👥</Text> }} />
              <Tab.Screen name="Rooms" component={RoomsScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🌐</Text> }} />
              <Tab.Screen name="Kudos" component={KudosScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>💛</Text> }} />
              <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🪪</Text> }} />
            </Tab.Navigator>
          </NavigationContainer>
        ) : (
          <LoginScreen onLogin={setUserToken} />
        )}
      </SettingsContext.Provider>
    </SafeAreaProvider>
  );
}

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.bg },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: THEME.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: THEME.textMuted, marginBottom: 24 },
  infoText: { fontSize: 15, color: THEME.textMuted, lineHeight: 22 },
  card: { backgroundColor: THEME.surface, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: THEME.border, marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: THEME.text, marginBottom: 4 },
  
  // Inputs & Buttons
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: THEME.surface, borderTopWidth: 1, borderTopColor: THEME.border },
  input: { flex: 1, backgroundColor: THEME.bg, color: THEME.text, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: THEME.border },
  sendBtn: { backgroundColor: THEME.primary, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 22, marginLeft: 8 },
  sendBtnText: { color: THEME.text, fontWeight: 'bold', fontSize: 18 },
  primaryBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: THEME.text, fontWeight: 'bold', fontSize: 16 },
  
  // Chat
  messageBubble: { maxWidth: '80%', padding: 16, borderRadius: 16, marginBottom: 12 },
  msgUser: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  msgAI: { alignSelf: 'flex-start', backgroundColor: THEME.surface2, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: THEME.border },
  messageText: { color: THEME.text, fontSize: 16, lineHeight: 24 },
  header: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: THEME.border, backgroundColor: THEME.surface },
  headerText: { color: THEME.text, fontSize: 16, fontWeight: 'bold' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: THEME.success, marginRight: 8, shadowColor: THEME.success, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 },
  modeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: THEME.surface2, marginRight: 8, borderWidth: 1, borderColor: THEME.border },
  modeBtnActive: { backgroundColor: 'rgba(99,102,241,0.15)', borderColor: THEME.primary }
});
