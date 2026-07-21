import { db, firestoreReady } from '../config/firebase';
import { SSEService } from './sse.service';

export interface KudosMoment {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  triggeredByMessage: string; // the message that sparked the kudos
  createdAt: Date;
  isRead: boolean;
}

export class KudosService {

  /**
   * Send a Kudos to another user.
   * Kudos are always private — they notify the recipient but are never shown publicly.
   */
  static async sendKudos(
    fromUserId: string,
    fromUserName: string,
    toUserId: string,
    toUserName: string,
    triggeredByMessage: string
  ): Promise<{ success: boolean; kudosId: string }> {
    const kudosId = `kudos_${Date.now()}`;

    const kudos: KudosMoment = {
      id: kudosId,
      fromUserId,
      fromUserName,
      toUserId,
      toUserName,
      triggeredByMessage,
      createdAt: new Date(),
      isRead: false,
    };

    if (firestoreReady) {
      try {
        // Save kudos document
        await db.collection('kudos').doc(kudosId).set(kudos);

        // Update sender's given count
        await db.collection('users').doc(fromUserId).set({
          kudosGivenCount: db.collection('users').doc(fromUserId).get().then(d => (d.data()?.kudosGivenCount || 0) + 1)
        }, { merge: true });

        // Update recipient's received count
        await db.collection('users').doc(toUserId).set({
          kudosReceivedCount: db.collection('users').doc(toUserId).get().then(d => (d.data()?.kudosReceivedCount || 0) + 1)
        }, { merge: true });
      } catch (e) {
        console.error('[Kudos] Error saving kudos:', e);
      }
    }

    // Notify recipient via SSE (real-time, private notification)
    SSEService.emitToUser(toUserId, 'kudos-received', {
      from: fromUserName,
      message: `${fromUserName} appreciated something you said.`,
      triggeredByMessage,
      kudosId,
    });

    return { success: true, kudosId };
  }

  /**
   * Get kudos received by a user
   */
  static async getReceivedKudos(userId: string): Promise<KudosMoment[]> {
    if (!firestoreReady) {
      return [
        {
          id: 'mock_kudos_1',
          fromUserId: 'mock_priya',
          fromUserName: 'Priya',
          toUserId: userId,
          toUserName: 'You',
          triggeredByMessage: 'That I\'m not always okay when I say I am.',
          createdAt: new Date(Date.now() - 7200000),
          isRead: false,
        },
      ];
    }

    try {
      const snap = await db.collection('kudos')
        .where('toUserId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      return snap.docs.map(doc => doc.data() as KudosMoment);
    } catch (e) {
      console.error('[Kudos] Error fetching received kudos:', e);
      return [];
    }
  }

  /**
   * Get kudos sent by a user
   */
  static async getSentKudos(userId: string): Promise<KudosMoment[]> {
    if (!firestoreReady) return [];

    try {
      const snap = await db.collection('kudos')
        .where('fromUserId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      return snap.docs.map(doc => doc.data() as KudosMoment);
    } catch (e) {
      console.error('[Kudos] Error fetching sent kudos:', e);
      return [];
    }
  }

  /**
   * Mark kudos as read
   */
  static async markRead(kudosId: string, userId: string): Promise<void> {
    if (!firestoreReady) return;
    try {
      await db.collection('kudos').doc(kudosId).update({ isRead: true });
    } catch (e) {
      console.error('[Kudos] Error marking read:', e);
    }
  }

  /**
   * Get weekly stats for a user
   */
  static async getWeeklyStats(userId: string): Promise<{
    kudosSent: number;
    kudosReceived: number;
    humansIntroduced: number;
    roomsActive: number;
    conversationCount: number;
  }> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    if (!firestoreReady) {
      return {
        kudosSent: 3,
        kudosReceived: 2,
        humansIntroduced: 1,
        roomsActive: 2,
        conversationCount: 18,
      };
    }

    try {
      const [sentSnap, receivedSnap] = await Promise.all([
        db.collection('kudos').where('fromUserId', '==', userId)
          .where('createdAt', '>=', oneWeekAgo).get(),
        db.collection('kudos').where('toUserId', '==', userId)
          .where('createdAt', '>=', oneWeekAgo).get(),
      ]);

      return {
        kudosSent: sentSnap.size,
        kudosReceived: receivedSnap.size,
        humansIntroduced: 1, // TODO: track intro acceptances
        roomsActive: 2, // TODO: track room activity
        conversationCount: 18, // TODO: count chat messages this week
      };
    } catch (e) {
      console.error('[Kudos] Error fetching weekly stats:', e);
      return { kudosSent: 0, kudosReceived: 0, humansIntroduced: 0, roomsActive: 0, conversationCount: 0 };
    }
  }
}
