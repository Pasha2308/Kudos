import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import EventSource from 'react-native-sse';
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
  const { timeout = 5000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(resource, { ...options, signal: controller.signal });
  clearTimeout(id);
  return response;
};

const Tab = createBottomTabNavigator();

const THEME = {
  bg: '#0a0a0a',
  surface: '#171717',
  primary: '#4f46e5',
  secondary: '#a855f7',
  text: '#ffffff',
  textMuted: '#a3a3a3'
};

// --- SCREENS ---

function ChatScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [messages, setMessages] = useState<{id: string, text: string, sender: 'user'|'ai'}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mode, setMode] = useState<'cofounder'|'mentor'|'friend'>('cofounder');
  const flatListRef = React.useRef<FlatList>(null);

  useEffect(() => {
    // Fetch History
    const fetchHistory = async () => {
      try {
        const res = await fetchWithTimeout(`${apiUrl}/api/chat/history`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await res.json();
        if (data.history) {
          const formatted = data.history.map((msg: any) => ({
            id: msg.ts?.toString() || Date.now().toString() + Math.random(),
            text: msg.content,
            sender: msg.role === 'assistant' ? 'ai' : 'user'
          }));
          setMessages(formatted);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 300);
        }
      } catch (err) {
        console.error('History fetch error', err);
      }
    };
    fetchHistory();

    // SSE Sync
    const es = new EventSource(`${apiUrl}/api/stream?token=${userToken}`);
    es.addEventListener('message', (event: any) => {
      if (event.data) {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'chat-message') {
            const msg = parsed.message;
            setMessages(prev => {
              // Deduplicate if already exists
              if (prev.some(m => m.text === msg.content && m.sender === (msg.role === 'assistant' ? 'ai' : 'user'))) {
                return prev;
              }
              const newMsg = {
                id: msg.ts.toString(),
                text: msg.content,
                sender: msg.role === 'assistant' ? 'ai' : 'user'
              };
              return [...prev, newMsg as any];
            });
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          }
        } catch (e) { }
      }
    });

    return () => es.close();
  }, [apiUrl, userToken]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;
    const currentInput = input.trim();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Optimistic update
      setMessages(prev => [...prev, { id: Date.now().toString(), text: currentInput, sender: 'user' }]);
      setInput('');
      setErrorMsg('');
      setIsTyping(true);
      scrollToBottom();

      try {
        const res = await fetchWithTimeout(`${apiUrl}/api/chat/send`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ message: currentInput, mode })
        });
        const data = await res.json();
        if (data.reply) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // AI reply will come via SSE
        }
      } catch (err) {
        setErrorMsg('Failed to send message. Check connection.');
      } finally {
        setIsTyping(false);
      }
    };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.chatHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.onlineDot} />
            <Text style={styles.chatHeaderText}>Kudos</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['cofounder', 'mentor', 'friend'] as const).map(m => (
              <TouchableOpacity 
                key={m} 
                onPress={() => setMode(m)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: mode === m ? THEME.primary : THEME.surface }}
              >
                <Text style={{ color: mode === m ? THEME.bg : THEME.textMuted, fontSize: 12, fontWeight: 'bold' }}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
              <LinearGradient
                colors={['#4f46e5', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.messageBubble, styles.msgUser]}
              >
                <Text style={styles.messageText}>{item.text}</Text>
              </LinearGradient>
            ) : (
              <BlurView intensity={20} tint="dark" style={[styles.messageBubble, styles.msgAI, { overflow: 'hidden' }]}>
                <Text style={styles.messageText}>{item.text}</Text>
              </BlurView>
            )
          )}
          ListFooterComponent={
            <View>
              {isTyping && (
                <BlurView intensity={20} tint="dark" style={[styles.messageBubble, styles.msgAI, { width: 60, padding: 12, height: 42, justifyContent: 'center', overflow: 'hidden' }]}>
                  <ActivityIndicator size="small" color={THEME.textMuted} />
                </BlurView>
              )}
              {errorMsg !== '' && (
                <Text style={{ color: '#f87171', textAlign: 'center', marginVertical: 8 }}>{errorMsg}</Text>
              )}
            </View>
          }
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message Kudos..."
            placeholderTextColor={THEME.textMuted}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!input.trim() || isTyping) && { opacity: 0.5 }]} 
            onPress={sendMessage}
            disabled={!input.trim() || isTyping}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function KYCScreen() {
  const { apiUrl } = useContext(SettingsContext);
  const [status, setStatus] = useState<'loading'|'unverified'|'pending'|'approved'>('loading');
  const [fullName, setFullName] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await fetchWithTimeout(`${apiUrl}/api/kyc/status`);
      const data = await res.json();
      setStatus(data.status);
    } catch (err) {
      setStatus('unverified');
    }
  };

  useEffect(() => { fetchStatus(); }, [apiUrl]);

  const submitKYC = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStatus('loading');
      await fetchWithTimeout(`${apiUrl}/api/kyc/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, idData: 'mock_base64_img' })
      });
      await fetchStatus();
    } catch (err) {
      Alert.alert('Error', 'Failed to submit KYC');
    }
  };

  if (status === 'loading') {
    return <View style={styles.center}><ActivityIndicator color={THEME.primary} size="large" /></View>;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Identity Verification</Text>
        <Text style={styles.subtitle}>Status: <Text style={{ color: status === 'approved' ? '#4ade80' : status === 'pending' ? '#facc15' : '#f87171' }}>{status.toUpperCase()}</Text></Text>
        
        {status === 'unverified' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Submit your Details</Text>
            <TextInput
              style={styles.input}
              placeholder="Full Legal Name"
              placeholderTextColor={THEME.textMuted}
              value={fullName}
              onChangeText={setFullName}
            />
            <TouchableOpacity onPress={submitKYC}>
              <LinearGradient
                colors={['#4f46e5', '#a855f7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>Verify Identity</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        
        {status === 'pending' && (
          <Text style={styles.infoText}>Your identity verification is currently being processed. Please check back later.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

function MatchmakingScreen() {
  const { apiUrl } = useContext(SettingsContext);
  const [kycStatus, setKycStatus] = useState('loading');
  const [matchStatus, setMatchStatus] = useState<'idle'|'searching'|'matched'>('idle');

  useEffect(() => {
    const checkKyc = async () => {
      try {
        const res = await fetchWithTimeout(`${apiUrl}/api/kyc/status`);
        const data = await res.json();
        setKycStatus(data.status);
      } catch (err) {
        setKycStatus('unverified');
      }
    };
    checkKyc();
  }, [apiUrl]);

  const joinQueue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setMatchStatus('searching');
    try {
      const res = await fetchWithTimeout(`${apiUrl}/api/matchmaking/join`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        Alert.alert('Matchmaking', data.error);
        setMatchStatus('idle');
      }
    } catch (err) {
      setMatchStatus('idle');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Matchmaking</Text>
        <Text style={styles.subtitle}>Connect with other verified founders.</Text>

        {kycStatus !== 'approved' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>KYC Required</Text>
            <Text style={styles.infoText}>You must complete identity verification before joining the matchmaking network.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {matchStatus === 'idle' ? (
              <TouchableOpacity onPress={joinQueue}>
                <LinearGradient
                  colors={['#4f46e5', '#a855f7']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Find a Match</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.center}>
                <ActivityIndicator color={THEME.secondary} size="large" />
                <Text style={[styles.infoText, { marginTop: 16 }]}>Searching for verified founders...</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function MemoryScreen() {
  const { apiUrl, userToken } = useContext(SettingsContext);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemories = async () => {
      try {
        const res = await fetchWithTimeout(`${apiUrl}/api/memory/summary`, {
          headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const data = await res.json();
        setMemories(data.memories || []);
      } catch (err) { } finally { setLoading(false); }
    };
    fetchMemories();
  }, [apiUrl, userToken]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Memory</Text>
        <Text style={styles.subtitle}>What Kudos knows about you</Text>
        
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={THEME.primary} /></View>
        ) : (
          <FlatList
            data={memories}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <View style={[styles.card, { marginBottom: 12, padding: 16 }]}>
                <Text style={{ color: THEME.text }}>{item.fact}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.infoText}>No memories recorded yet.</Text>}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function SettingsScreen() {
  const { apiUrl, setApiUrl, userToken, setUserToken } = useContext(SettingsContext);
  const [preferences, setPreferences] = useState({ theme: 'dark', persona: 'cofounder', avatar: 'anime-glasses' });

  useEffect(() => {
    if (!userToken) return;
    fetch(`${apiUrl}/api/user/preferences`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.preferences) setPreferences(data.preferences);
      })
      .catch(console.error);
  }, [userToken, apiUrl]);

  const updatePreference = async (key: string, value: string) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    try {
      await fetch(`${apiUrl}/api/user/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(newPrefs)
      });
    } catch (e) {
      console.error(e);
    }
  };
  
  const OptionButton = ({ label, active, onPress }: any) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        paddingVertical: 8, paddingHorizontal: 12, 
        backgroundColor: active ? THEME.primary : THEME.bg,
        borderRadius: 8, borderWidth: 1, borderColor: active ? THEME.primary : '#333',
        marginRight: 8, marginBottom: 8
      }}>
      <Text style={{ color: active ? '#fff' : THEME.textMuted, fontSize: 13, fontWeight: '500' }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Configure Kudos experience.</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backend API URL</Text>
          <Text style={styles.infoText}>Format: http://[YOUR-IP]:8080</Text>
          <TextInput
            style={[styles.input, { marginBottom: 16, marginTop: 12, marginRight: 0 }]}
            placeholder="http://192.168.1.8:8080"
            placeholderTextColor={THEME.textMuted}
            value={apiUrl}
            onChangeText={setApiUrl}
          />
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardTitle}>Preferences (Synced)</Text>
          <Text style={[styles.infoText, { marginBottom: 12 }]}>Changes apply instantly to all devices.</Text>
          
          <Text style={{ color: THEME.text, marginBottom: 8, fontWeight: 'bold' }}>Theme</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
            <OptionButton label="Dark Mode" active={preferences.theme === 'dark'} onPress={() => updatePreference('theme', 'dark')} />
            <OptionButton label="Light Mode" active={preferences.theme === 'light'} onPress={() => updatePreference('theme', 'light')} />
            <OptionButton label="Midnight" active={preferences.theme === 'midnight'} onPress={() => updatePreference('theme', 'midnight')} />
          </View>

          <Text style={{ color: THEME.text, marginBottom: 8, fontWeight: 'bold' }}>Persona</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
            <OptionButton label="Cofounder" active={preferences.persona === 'cofounder'} onPress={() => updatePreference('persona', 'cofounder')} />
            <OptionButton label="Mentor" active={preferences.persona === 'mentor'} onPress={() => updatePreference('persona', 'mentor')} />
            <OptionButton label="Friend" active={preferences.persona === 'friend'} onPress={() => updatePreference('persona', 'friend')} />
          </View>

          <Text style={{ color: THEME.text, marginBottom: 8, fontWeight: 'bold' }}>Desktop Avatar</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            <OptionButton label="Anime" active={preferences.avatar === 'anime-glasses'} onPress={() => updatePreference('avatar', 'anime-glasses')} />
            <OptionButton label="Robot" active={preferences.avatar === 'robot'} onPress={() => updatePreference('avatar', 'robot')} />
            <OptionButton label="Minimal" active={preferences.avatar === 'minimalist'} onPress={() => updatePreference('avatar', 'minimalist')} />
          </View>
        </View>

        <View style={[styles.card, { marginTop: 16, borderColor: '#ef4444' }]}>
          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: '#ef4444' }]} 
            onPress={async () => {
              await AsyncStorage.removeItem('@kudos_token');
              setUserToken(null);
            }}
          >
            <Text style={styles.primaryBtnText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

// --- APP ENTRY ---

function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const { apiUrl } = useContext(SettingsContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const uid = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
      const token = `mock_token_${uid}`;
      
      const res = await fetchWithTimeout(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, name: name || email.split('@')[0] })
      });
      
      if (res.ok) {
        // Mock FCM Token Push
        try {
          await fetchWithTimeout(`${apiUrl}/api/auth/fcm-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ fcmToken: 'mock_expo_push_token_123' })
          });
        } catch { /* ignore if token post fails */ }
        
        await AsyncStorage.setItem('@kudos_token', token);
        onLogin(token);
      } else {
        Alert.alert('Error', 'Login failed');
      }
    } catch (err) {
      Alert.alert('Error', 'Network request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={styles.center} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ width: '85%', maxWidth: 400 }}>
          <Text style={[styles.title, { textAlign: 'center', marginBottom: 8 }]}>Kudos</Text>
          <Text style={[styles.subtitle, { textAlign: 'center', marginBottom: 32 }]}>
            {isSignup ? 'Create your account' : 'Sign in to continue'}
          </Text>
          
          <View style={styles.card}>
            {isSignup && (
              <TextInput
                style={[styles.input, { marginBottom: 16, marginRight: 0 }]}
                placeholder="Full Name"
                placeholderTextColor={THEME.textMuted}
                value={name}
                onChangeText={setName}
              />
            )}
            <TextInput 
              style={[styles.input, { marginBottom: 16, marginRight: 0 }]} 
              placeholder="Email address" 
              placeholderTextColor={THEME.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput 
              style={[styles.input, { marginBottom: 24, marginRight: 0 }]} 
              placeholder="Password" 
              placeholderTextColor={THEME.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <TouchableOpacity 
              style={[styles.primaryBtn, { backgroundColor: THEME.primary }]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{isSignup ? 'Sign Up' : 'Log In'}</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 24, padding: 12 }} onPress={() => setIsSignup(!isSignup)}>
              <Text style={{ color: THEME.textMuted, textAlign: 'center' }}>
                {isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  const [apiUrl, setApiUrl] = useState('http://192.168.1.8:8080');
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        const token = await AsyncStorage.getItem('@kudos_token');
        if (token) setUserToken(token);
      } catch (e) {
        // ignore
      } finally {
        setIsReady(true);
      }
    };
    loadSession();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: THEME.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={THEME.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SettingsContext.Provider value={{ apiUrl, setApiUrl, userToken, setUserToken }}>
        {userToken ? (
          <NavigationContainer theme={DarkTheme}>
            <Tab.Navigator
              screenOptions={{
                headerShown: false,
                tabBarStyle: { backgroundColor: THEME.bg, borderTopColor: '#262626' },
                tabBarActiveTintColor: THEME.secondary,
                tabBarInactiveTintColor: THEME.textMuted
              }}
            >
              <Tab.Screen name="Chat" component={ChatScreen} />
              <Tab.Screen name="Matchmaking" component={MatchmakingScreen} />
              <Tab.Screen name="Verification" component={KYCScreen} />
              <Tab.Screen name="Memory" component={MemoryScreen} />
              <Tab.Screen name="Settings" component={SettingsScreen} />
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', color: THEME.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: THEME.textMuted, marginBottom: 24 },
  infoText: { fontSize: 15, color: THEME.textMuted, lineHeight: 22 },
  card: { backgroundColor: THEME.surface, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#262626' },
  cardTitle: { fontSize: 20, fontWeight: '600', color: THEME.text, marginBottom: 16 },
  
  // Inputs & Buttons
  inputContainer: { flexDirection: 'row', padding: 16, backgroundColor: THEME.surface, borderTopWidth: 1, borderTopColor: '#262626' },
  input: { flex: 1, backgroundColor: THEME.bg, color: THEME.text, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginRight: 12, borderWidth: 1, borderColor: '#262626' },
  sendBtn: { backgroundColor: THEME.primary, paddingHorizontal: 20, justifyContent: 'center', borderRadius: 12 },
  sendBtnText: { color: THEME.text, fontWeight: 'bold' },
  primaryBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { color: THEME.text, fontWeight: 'bold', fontSize: 16 },
  
  // Chat
  messageBubble: { maxWidth: '80%', padding: 16, borderRadius: 16, marginBottom: 12 },
  msgUser: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  msgAI: { alignSelf: 'flex-start', backgroundColor: THEME.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#262626' },
  messageText: { color: THEME.text, fontSize: 16 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#262626', backgroundColor: THEME.bg },
  chatHeaderText: { color: THEME.text, fontSize: 16, fontWeight: 'bold' },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ade80', marginRight: 8, shadowColor: '#4ade80', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 }
});
