import { getGroqClient } from '../config/groq';
import { db, firestoreReady } from '../config/firebase';

export interface DailyChallenge {
  id: string;
  text: string;
  category: 'connection' | 'reflection' | 'vulnerability' | 'action';
  weeklyGoal: number; // how many per week to aim for
}

const CHALLENGE_BANK: DailyChallenge[] = [
  {
    id: 'tell_something_real',
    text: 'Tell someone something real about yourself today.',
    category: 'vulnerability',
    weeklyGoal: 3,
  },
  {
    id: 'ask_deep_question',
    text: 'Ask someone a question you actually want the answer to.',
    category: 'connection',
    weeklyGoal: 3,
  },
  {
    id: 'acknowledge_feeling',
    text: 'Acknowledge one feeling you have been avoiding this week.',
    category: 'reflection',
    weeklyGoal: 2,
  },
  {
    id: 'reach_out_first',
    text: 'Reach out to someone first today. Don\'t wait for them.',
    category: 'action',
    weeklyGoal: 2,
  },
  {
    id: 'share_win',
    text: 'Share a small win with someone who would actually care.',
    category: 'connection',
    weeklyGoal: 2,
  },
  {
    id: 'admit_struggle',
    text: 'Admit to someone that something has been hard lately.',
    category: 'vulnerability',
    weeklyGoal: 1,
  },
  {
    id: 'say_appreciate',
    text: 'Tell someone what you appreciate about them. Specifically.',
    category: 'connection',
    weeklyGoal: 3,
  },
  {
    id: 'honest_checkin',
    text: 'When someone asks "how are you?", answer honestly.',
    category: 'vulnerability',
    weeklyGoal: 3,
  },
];

export class ChallengeService {

  /**
   * Returns today's challenge for a user.
   * Rotates daily based on day-of-year.
   */
  static getTodayChallenge(): DailyChallenge {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );
    return CHALLENGE_BANK[dayOfYear % CHALLENGE_BANK.length];
  }

  /**
   * Get the weekly progress for challenges
   */
  static async getWeeklyProgress(userId: string): Promise<{
    challenge: DailyChallenge;
    completedToday: boolean;
    completedThisWeek: number;
    weeklyGoal: number;
  }> {
    const challenge = ChallengeService.getTodayChallenge();

    if (!firestoreReady) {
      return {
        challenge,
        completedToday: false,
        completedThisWeek: 3,
        weeklyGoal: challenge.weeklyGoal,
      };
    }

    try {
      const today = new Date().toDateString();
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const completionsSnap = await db.collection('users').doc(userId)
        .collection('challengeCompletions')
        .where('completedAt', '>=', oneWeekAgo)
        .get();

      const completedToday = completionsSnap.docs.some(
        (d: any) => new Date(d.data().completedAt?.toDate()).toDateString() === today
      );

      return {
        challenge,
        completedToday,
        completedThisWeek: completionsSnap.size,
        weeklyGoal: challenge.weeklyGoal,
      };
    } catch (e) {
      return {
        challenge,
        completedToday: false,
        completedThisWeek: 0,
        weeklyGoal: challenge.weeklyGoal,
      };
    }
  }

  /**
   * Mark today's challenge as complete
   */
  static async completeChallenge(userId: string, challengeId: string): Promise<void> {
    if (!firestoreReady) return;

    try {
      await db.collection('users').doc(userId)
        .collection('challengeCompletions')
        .add({
          challengeId,
          completedAt: new Date(),
        });
    } catch (e) {
      console.error('[Challenge] Error completing challenge:', e);
    }
  }

  /**
   * Generates a cofounder chemistry test challenge for two users
   */
  static async generateChemistryChallenge(
    userId: string,
    partnerId: string
  ): Promise<{ challenge: string; sprintId: string }> {
    const groq = getGroqClient();
    const sprintId = `sprint_${userId}_${partnerId}_${Date.now()}`;

    const prompts = [
      'You have $10,000 and 2 weeks. What would you build? Explain your approach and first 3 steps.',
      'Describe a time you disagreed with someone important about strategy. What did you do?',
      'You lose your biggest customer tomorrow. Walk me through your next 48 hours.',
      'What\'s the decision you\'re most proud of? What were you risking?',
      'You and your cofounder have irreconcilable differences on a major pivot. How do you resolve it?',
    ];

    const dayOfWeek = new Date().getDay();
    const challenge = prompts[dayOfWeek % prompts.length];

    if (firestoreReady) {
      try {
        await db.collection('chemistryTests').doc(sprintId).set({
          userId,
          partnerId,
          challenge,
          day: 1,
          startedAt: new Date(),
          closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'active',
        });
      } catch (e) {
        console.error('[Challenge] Error creating chemistry sprint:', e);
      }
    }

    return { challenge, sprintId };
  }

  /**
   * Submit a chemistry test response
   */
  static async submitChemistryResponse(
    sprintId: string,
    userId: string,
    response: string
  ): Promise<void> {
    if (!firestoreReady) return;

    try {
      await db.collection('chemistryTests').doc(sprintId)
        .collection('responses').add({
          userId,
          response,
          submittedAt: new Date(),
        });
    } catch (e) {
      console.error('[Challenge] Error submitting response:', e);
    }
  }

  /**
   * Generate AI summary of chemistry test results
   */
  static async generateChemistrySummary(sprintId: string): Promise<{
    workStyleMatch: number;
    riskMatch: number;
    communicationMatch: number;
    visionMatch: number;
    companionSummary: string;
  }> {
    // TODO: fetch responses and generate real summary
    // For now return mock
    return {
      workStyleMatch: 82,
      riskMatch: 95,
      communicationMatch: 45,
      visionMatch: 78,
      companionSummary: "You'd make a great cofounder pair for execution. Your communication styles differ — that's worth a real conversation before committing.",
    };
  }
}
