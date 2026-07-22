import { getGroqClient } from '../../config/groq';
import { db, firestoreReady } from '../../config/firebase';

export interface OnboardingStep {
  step: number; // 1-4
  completed: boolean;
  data?: any;
}

export interface ValuesCard {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  dimension: string;
}

const VALUES_CARDS: ValuesCard[] = [
  {
    id: 'work_style',
    question: 'When something goes wrong, I tend to:',
    optionA: 'Fix it alone first',
    optionB: 'Talk it through with someone',
    dimension: 'workStyle',
  },
  {
    id: 'risk',
    question: 'When a new opportunity appears, I:',
    optionA: 'Research carefully before deciding',
    optionB: 'Jump in and figure it out',
    dimension: 'riskTolerance',
  },
  {
    id: 'communication',
    question: 'I prefer people who are:',
    optionA: 'Direct, even if it stings',
    optionB: 'Diplomatic, feelings matter',
    dimension: 'communicationStyle',
  },
  {
    id: 'energy',
    question: 'After a long social day, I feel:',
    optionA: 'Drained — I need alone time',
    optionB: 'Energized — people fuel me',
    dimension: 'energyType',
  },
  {
    id: 'life_stage',
    question: "Right now I'm mostly focused on:",
    optionA: 'Exploring what I want',
    optionB: 'Executing on what I know',
    dimension: 'lifeStage',
  },
];

export class OnboardingService {

  /**
   * Returns the 5 values pulse cards for onboarding step 2
   */
  static getValuesCards(): ValuesCard[] {
    return VALUES_CARDS;
  }

  /**
   * Saves onboarding answers for a user and generates personality tags
   */
  static async saveValuesAnswers(
    userId: string,
    answers: Record<string, 'A' | 'B'>
  ): Promise<string[]> {
    const dimensionMap: Record<string, string> = {
      workStyle: answers.work_style === 'A' ? 'Solo' : 'Collaborative',
      riskTolerance: answers.risk === 'A' ? 'Methodical' : 'Risk-taker',
      communicationStyle: answers.communication === 'A' ? 'Direct' : 'Diplomatic',
      energyType: answers.energy === 'A' ? 'Introvert' : 'Extrovert',
      lifeStage: answers.life_stage === 'A' ? 'Exploring' : 'Builder',
    };

    const personalityTags = Object.values(dimensionMap);

    if (firestoreReady) {
      try {
        await db.collection('users').doc(userId).set({
          valuesAnswers: answers,
          personalityDimensions: dimensionMap,
          personalityTags,
          onboardingStep: 2,
          updatedAt: new Date(),
        }, { merge: true });
      } catch (e) {
        console.error('[Onboarding] Error saving values:', e);
      }
    }

    return personalityTags;
  }

  /**
   * Saves basic profile info from onboarding step 1
   */
  static async saveBasicProfile(
    userId: string,
    data: { name: string; nickname?: string; role?: string; tagline?: string; photoURL?: string }
  ): Promise<void> {
    if (firestoreReady) {
      try {
        await db.collection('users').doc(userId).set({
          name: data.name,
          nickname: data.nickname || data.name,
          role: data.role || 'Other',
          tagline: data.tagline || '',
          photoURL: data.photoURL || '',
          onboardingStep: 1,
          updatedAt: new Date(),
        }, { merge: true });
      } catch (e) {
        console.error('[Onboarding] Error saving basic profile:', e);
      }
    }
  }

  /**
   * Generates the AI companion's first question for step 3
   */
  static async getFirstConversationPrompt(userName: string): Promise<string> {
    return `Hey ${userName}! Nice to meet you. One honest question — what's something you're really proud of that most people don't know about?`;
  }

  /**
   * Generates a "who you might meet" preview for step 4
   */
  static async generatePreviewPeople(): Promise<any[]> {
    return [
      { name: 'Priya', trait: 'Midnight builder', emoji: '🌙' },
      { name: 'Arjun', trait: 'Overthinks everything', emoji: '🧠' },
      { name: 'Zara', trait: 'Creates before sunrise', emoji: '🎨' },
    ];
  }

  /**
   * Marks onboarding complete for a user
   */
  static async completeOnboarding(userId: string): Promise<void> {
    if (firestoreReady) {
      try {
        await db.collection('users').doc(userId).set({
          onboardingComplete: true,
          onboardingCompletedAt: new Date(),
        }, { merge: true });
      } catch (e) {
        console.error('[Onboarding] Error completing onboarding:', e);
      }
    }
  }

  /**
   * Checks if a user has completed onboarding
   */
  static async isOnboardingComplete(userId: string): Promise<boolean> {
    if (!firestoreReady) return false;
    try {
      const doc = await db.collection('users').doc(userId).get();
      return doc.data()?.onboardingComplete === true;
    } catch (e) {
      return false;
    }
  }
}
