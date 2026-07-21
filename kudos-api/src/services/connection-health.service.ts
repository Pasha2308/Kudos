import { db, firestoreReady } from '../config/firebase';

export interface ConnectionHealthScore {
  score: number; // 0-100
  label: 'Lonely' | 'Starting' | 'Growing' | 'Connected' | 'Thriving';
  conversationStreak: number;
  totalHumansMet: number;
  kudosGiven: number;
  irlMeetups: number;
  weeklyConversations: number;
  nudgeMessage: string;
}

export class ConnectionHealthService {

  /**
   * Calculates the anti-loneliness score for a user.
   * This score is private — never shown to others.
   */
  static async getScore(userId: string): Promise<ConnectionHealthScore> {
    if (!firestoreReady) {
      return ConnectionHealthService.getMockScore();
    }

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data() || {};

      // Pull metrics
      const conversationStreak = userData.conversationStreak || 0;
      const totalHumansMet = userData.humansMet || 0;
      const kudosGiven = userData.kudosGivenCount || 0;
      const irlMeetups = userData.irlMeetups || 0;
      const weeklyConversations = userData.weeklyConversations || 0;

      // Calculate score (0-100)
      // Conversation streak: up to 30 pts (3 pts per day, max 10 days)
      // Weekly conversations: up to 20 pts (2 pts per convo, max 10)
      // Humans met: up to 20 pts (5 pts each, max 4)
      // Kudos given: up to 15 pts (3 pts each, max 5)
      // IRL meetups: up to 15 pts (5 pts each, max 3)
      const score = Math.min(100,
        Math.min(conversationStreak * 3, 30) +
        Math.min(weeklyConversations * 2, 20) +
        Math.min(totalHumansMet * 5, 20) +
        Math.min(kudosGiven * 3, 15) +
        Math.min(irlMeetups * 5, 15)
      );

      const { label, nudgeMessage } = ConnectionHealthService.getLabel(score, weeklyConversations, totalHumansMet);

      return {
        score,
        label,
        conversationStreak,
        totalHumansMet,
        kudosGiven,
        irlMeetups,
        weeklyConversations,
        nudgeMessage,
      };
    } catch (e) {
      console.error('[ConnectionHealth] Error:', e);
      return ConnectionHealthService.getMockScore();
    }
  }

  /**
   * Increments conversation streak on daily check-in
   */
  static async incrementStreak(userId: string): Promise<void> {
    if (!firestoreReady) return;
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const lastActive = userDoc.data()?.lastActiveDate;
      const today = new Date().toDateString();

      if (lastActive !== today) {
        const currentStreak = userDoc.data()?.conversationStreak || 0;
        await db.collection('users').doc(userId).set({
          conversationStreak: currentStreak + 1,
          lastActiveDate: today,
          weeklyConversations: (userDoc.data()?.weeklyConversations || 0) + 1,
        }, { merge: true });
      }
    } catch (e) {
      console.error('[ConnectionHealth] Error incrementing streak:', e);
    }
  }

  /**
   * Records an IRL meetup
   */
  static async recordIRLMeetup(userId: string): Promise<void> {
    if (!firestoreReady) return;
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      const current = userDoc.data()?.irlMeetups || 0;
      await db.collection('users').doc(userId).set({
        irlMeetups: current + 1,
      }, { merge: true });
    } catch (e) {
      console.error('[ConnectionHealth] Error recording IRL meetup:', e);
    }
  }

  static getLabel(score: number, weeklyConversations: number, humansMet: number): {
    label: ConnectionHealthScore['label'];
    nudgeMessage: string;
  } {
    if (score < 15) {
      return {
        label: 'Lonely',
        nudgeMessage: 'Your companion is here. Start with one honest conversation today.',
      };
    } else if (score < 35) {
      return {
        label: 'Starting',
        nudgeMessage: `You've started the journey. ${weeklyConversations > 0 ? `${weeklyConversations} conversations this week.` : 'Talk to your companion today.'}`,
      };
    } else if (score < 60) {
      return {
        label: 'Growing',
        nudgeMessage: humansMet > 0
          ? `You've met ${humansMet} real human${humansMet > 1 ? 's' : ''}. One more step toward thriving. 🎉`
          : 'You had meaningful conversations this week. One step away from a human intro.',
      };
    } else if (score < 80) {
      return {
        label: 'Connected',
        nudgeMessage: 'You\'re building real connections. Keep showing up.',
      };
    } else {
      return {
        label: 'Thriving',
        nudgeMessage: 'You\'re what this app is built for. Keep being real. 🌟',
      };
    }
  }

  static getMockScore(): ConnectionHealthScore {
    return {
      score: 74,
      label: 'Growing',
      conversationStreak: 12,
      totalHumansMet: 3,
      kudosGiven: 11,
      irlMeetups: 1,
      weeklyConversations: 18,
      nudgeMessage: 'You had 18 conversations this week. One step away from a human intro. 🎉',
    };
  }
}
