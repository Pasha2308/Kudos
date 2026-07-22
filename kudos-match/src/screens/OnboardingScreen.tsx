import React, { useState, useContext } from 'react';
import {
  View, Text, SafeAreaView, StyleSheet, ScrollView,
  TouchableOpacity, Animated, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Button } from '../components/Button';
import { COLORS, FONT, RADIUS, SIZE, SPACING, SHADOW } from '../theme';
import { SettingsContext } from '../contexts/SettingsContext';

const { width } = Dimensions.get('window');

interface Step {
  question: string;
  subtitle: string;
  key: string;
  options: { emoji: string; label: string; description: string; value: string }[];
}

const STEPS: Step[] = [
  {
    question: 'What kind of builder are you?',
    subtitle: 'Your companion will adjust to match you.',
    key: 'builderType',
    options: [
      { emoji: '🏗️', label: 'Solo Founder', description: 'Building alone, figuring it out in real time.', value: 'solo_founder' },
      { emoji: '🤝', label: 'Operator', description: 'Running a team, keeping everything together.', value: 'operator' },
      { emoji: '💡', label: 'Creative', description: 'Making things. Ideas first, systems later.', value: 'creative' },
      { emoji: '🔍', label: 'Explorer', description: "Still figuring out what I'm building.", value: 'explorer' },
    ],
  },
  {
    question: 'What do you need most right now?',
    subtitle: 'Be honest. There are no wrong answers.',
    key: 'primaryNeed',
    options: [
      { emoji: '💬', label: 'Someone to talk to', description: 'A space to process without judgment.', value: 'talk' },
      { emoji: '🎯', label: 'Accountability', description: 'Someone to keep me on track.', value: 'accountability' },
      { emoji: '👥', label: 'Real connections', description: 'People who get what I'm building.', value: 'connections' },
      { emoji: '🌀', label: 'All of the above', description: "I need everything — and that's okay.", value: 'all' },
    ],
  },
  {
    question: "What's your comfort with openness?",
    subtitle: 'Your companion respects every setting.',
    key: 'vulnerability',
    options: [
      { emoji: '📖', label: 'Open book', description: 'I share freely and process out loud.', value: 'open' },
      { emoji: '🚪', label: 'Gradually', description: "I open up once I trust someone.", value: 'gradual' },
      { emoji: '🔒', label: 'Mostly private', description: 'I keep most things close.', value: 'private' },
      { emoji: '🤷', label: 'Not sure yet', description: "Still figuring out what feels safe.", value: 'unsure' },
    ],
  },
];

export function OnboardingScreen() {
  const { setHasCompletedOnboarding, apiUrl, userToken } = useContext(SettingsContext);
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});

  const currentStep = STEPS[step];
  const selected = selections[currentStep.key];
  const isLast = step === STEPS.length - 1;

  const handleSelect = (value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelections(prev => ({ ...prev, [currentStep.key]: value }));
  };

  const handleNext = async () => {
    if (!selected) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isLast) {
      // Save onboarding data to API
      try {
        await fetch(`${apiUrl}/api/auth/onboarding`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
          body: JSON.stringify({ preferences: selections }),
        });
      } catch (e) { /* non-blocking */ }

      setHasCompletedOnboarding(true);
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHasCompletedOnboarding(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        <TouchableOpacity onPress={handleSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 20 }}>
          <Text style={styles.skipText}>Skip →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Question */}
        <Text style={styles.question}>{currentStep.question}</Text>
        <Text style={styles.subtitle}>{currentStep.subtitle}</Text>

        {/* Options */}
        <View style={styles.options}>
          {currentStep.options.map(opt => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.option, isSelected && styles.optionSelected]}
                onPress={() => handleSelect(opt.value)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, isSelected && { color: COLORS.text }]}>{opt.label}</Text>
                  <Text style={styles.optionDesc}>{opt.description}</Text>
                </View>
                {isSelected && (
                  <LinearGradient
                    colors={COLORS.gradientPrimary}
                    style={styles.checkCircle}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>✓</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Next button */}
      <View style={styles.footer}>
        <Button
          label={isLast ? 'Meet my companion  →' : 'Next  →'}
          onPress={handleNext}
          disabled={!selected}
        />
        {step > 0 && (
          <TouchableOpacity onPress={() => setStep(s => s - 1)} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.sm,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 24, backgroundColor: COLORS.primary,
    ...SHADOW.glow,
  },
  skipText: { ...FONT.caption, color: COLORS.textMuted },
  scroll: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  question: {
    ...FONT.h1, color: COLORS.text, marginBottom: SPACING.sm,
    fontSize: 26, lineHeight: 34,
  },
  subtitle: { ...FONT.body, color: COLORS.textMuted, marginBottom: SPACING.xl },
  options: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface1,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    gap: 14,
    minHeight: 72,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(99,102,241,0.08)',
    ...SHADOW.glow,
  },
  optionEmoji: { fontSize: 26 },
  optionLabel: { ...FONT.bodyBold, color: COLORS.textBody, marginBottom: 2 },
  optionDesc: { ...FONT.caption, color: COLORS.textMuted, lineHeight: 18 },
  checkCircle: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg,
    paddingTop: SPACING.md, gap: 4,
  },
  backBtn: { alignItems: 'center', paddingVertical: 12 },
  backText: { ...FONT.caption, color: COLORS.textMuted },
});
