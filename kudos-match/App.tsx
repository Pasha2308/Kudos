import React, { useState, useContext } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { SettingsProvider, SettingsContext } from './src/contexts/SettingsContext';
import { BottomSheet } from './src/components/BottomSheet';

// Screens
import { LoginScreen } from './src/screens/LoginScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { HumansScreen } from './src/screens/HumansScreen';
import { RoomsScreen } from './src/screens/RoomsScreen';
import { DMsScreen } from './src/screens/DMsScreen';
import { KudosScreen } from './src/screens/KudosScreen';
import { BuilderToolsScreen } from './src/screens/BuilderToolsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

import { COLORS, SPACING, SIZE, FONT, SHADOW } from './src/theme';

const Tab = createBottomTabNavigator();

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tab Bar
// ─────────────────────────────────────────────────────────────────────────────
const TAB_ICONS = [
  { key: 'Chat', emoji: '💬', label: 'Chat' },
  { key: 'Humans', emoji: '👥', label: 'Humans' },
  { key: 'Rooms', emoji: '🌐', label: 'Rooms' },
  { key: 'More', emoji: '···', label: 'More' },
];

function CustomTabBar({ state, descriptors, navigation, onMorePress }: any) {
  const routes = state.routes.filter((r: any) => r.name !== '_more');

  return (
    <View style={tabStyles.bar}>
      {routes.map((route: any, i: number) => {
        const isFocused = state.index === i;
        const tab = TAB_ICONS.find(t => t.key === route.name) || TAB_ICONS[3];

        const onPress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (route.name === 'More') {
            onMorePress();
            return;
          }
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tab}
            onPress={onPress}
            activeOpacity={0.8}
          >
            {isFocused && (
              <LinearGradient
                colors={['rgba(99,102,241,0.15)', 'transparent']}
                style={tabStyles.activeGlow}
              />
            )}
            <Text style={[tabStyles.emoji, tab.key === 'More' && tabStyles.moreText]}>
              {tab.emoji}
            </Text>
            <Text style={[tabStyles.label, isFocused && tabStyles.labelActive]}>
              {tab.label}
            </Text>
            {isFocused && <View style={tabStyles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// More Panel sheet contents
// ─────────────────────────────────────────────────────────────────────────────
const MORE_ITEMS = [
  { icon: '✉️', label: 'Direct Messages', subtitle: 'Chat with humans', badge: 2, screen: 'DMs' },
  { icon: '💛', label: 'Kudos Moments', subtitle: 'Private appreciation', badge: 1, screen: 'Kudos' },
  { icon: '🎯', label: 'Builder Tools', subtitle: 'Daily challenges', badge: 0, screen: 'BuilderTools' },
  { icon: '👤', label: 'Profile', subtitle: 'Your story', badge: 0, screen: null },
  { icon: '⚙️', label: 'Settings', subtitle: 'Notifications, privacy', badge: 0, screen: 'Settings' },
];

function MorePanel({ visible, onClose, onNavigate }: { visible: boolean; onClose: () => void; onNavigate: (screen: string) => void }) {
  return (
    <BottomSheet visible={visible} onClose={onClose} height={SIZE.bottomSheet}>
      {MORE_ITEMS.map(item => (
        <TouchableOpacity
          key={item.label}
          style={moreStyles.row}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); if (item.screen) onNavigate(item.screen); }}
          activeOpacity={0.8}
        >
          <View style={moreStyles.rowIcon}>
            <Text style={moreStyles.rowEmoji}>{item.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={moreStyles.rowLabel}>{item.label}</Text>
            <Text style={moreStyles.rowSub}>{item.subtitle}</Text>
          </View>
          {item.badge > 0 && (
            <View style={moreStyles.badge}>
              <Text style={moreStyles.badgeText}>{item.badge}</Text>
            </View>
          )}
          <Text style={moreStyles.chevron}>›</Text>
        </TouchableOpacity>
      ))}
      <Text style={moreStyles.version}>v1.0.0 · Kudos</Text>
    </BottomSheet>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Nav wrapper
// ─────────────────────────────────────────────────────────────────────────────
function MainApp() {
  const [showMore, setShowMore] = useState(false);
  const [currentFullScreen, setCurrentFullScreen] = useState<string | null>(null);

  const navigate = (screen: string) => setCurrentFullScreen(screen);

  const SCREEN_MAP: Record<string, React.ReactNode> = {
    DMs: <DMsScreen />,
    Kudos: <KudosScreen />,
    BuilderTools: <BuilderToolsScreen />,
    Settings: <SettingsScreen />,
  };

  if (currentFullScreen) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        {SCREEN_MAP[currentFullScreen]}
        <View style={tabStyles.backBar}>
          <TouchableOpacity style={tabStyles.backBarBtn} onPress={() => setCurrentFullScreen(null)}>
            <Text style={tabStyles.backBarText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer theme={{
        ...DarkTheme,
        colors: { ...DarkTheme.colors, background: COLORS.bg, card: COLORS.surface1, border: COLORS.border, primary: COLORS.primary },
      }}>
        <Tab.Navigator
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <CustomTabBar {...props} onMorePress={() => setShowMore(true)} />}
        >
          <Tab.Screen name="Chat" component={ChatScreen} />
          <Tab.Screen name="Humans" component={HumansScreen} />
          <Tab.Screen name="Rooms" component={RoomsScreen} />
          <Tab.Screen name="More" component={ChatScreen} />
        </Tab.Navigator>
      </NavigationContainer>

      <MorePanel
        visible={showMore}
        onClose={() => setShowMore(false)}
        onNavigate={navigate}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root: Auth gating
// ─────────────────────────────────────────────────────────────────────────────
function AppContent() {
  const { userToken, hasCompletedOnboarding, isReady } = useContext(SettingsContext);

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient
          colors={COLORS.gradientPrimary}
          style={{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
        >
          <Text style={{ fontSize: 28 }}>✦</Text>
        </LinearGradient>
        <Text style={{ ...FONT.h1, color: COLORS.text, marginBottom: 8 }}>Kudos</Text>
        <Text style={{ ...FONT.caption, color: COLORS.textMuted }}>Stop being lonely. Start being real.</Text>
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  if (!userToken) return <LoginScreen />;
  if (!hasCompletedOnboarding) return <OnboardingScreen />;
  return <MainApp />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface1,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: SIZE.tabBar,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    ...SHADOW.modal,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
  },
  activeGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 20,
  },
  emoji: { fontSize: 20 },
  moreText: { fontSize: 16, color: COLORS.textMuted, fontWeight: '700', letterSpacing: 1 },
  label: { ...FONT.caption, color: COLORS.textMuted, fontSize: 10, fontWeight: '600' },
  labelActive: { color: COLORS.primary },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
    ...SHADOW.glow,
  },
  backBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface1,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: SIZE.tabBar,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
  },
  backBarBtn: { paddingVertical: 8 },
  backBarText: { ...FONT.bodyBold, color: COLORS.primary },
});

const moreStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 14,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  rowEmoji: { fontSize: 20 },
  rowLabel: { ...FONT.bodyBold, color: COLORS.text, marginBottom: 2 },
  rowSub: { ...FONT.caption, color: COLORS.textMuted },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZE.badgeMin / 2,
    minWidth: SIZE.badgeMin, height: SIZE.badgeMin,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { ...FONT.label, color: '#fff', fontSize: 10 },
  chevron: { fontSize: 24, color: COLORS.textMuted, marginLeft: 4 },
  version: { ...FONT.caption, color: COLORS.textMuted, textAlign: 'center', padding: 20 },
});
