import { getGroqClient } from '../../config/groq';
import { db, firestoreReady } from '../../config/firebase';

export interface UserProfile {
  uid: string;
  name: string;
  bio?: string;
  location?: string;
  personalityTags?: string[];
  values?: string[];
  workStyle?: string;
  riskTolerance?: string;
  communicationStyle?: string;
  energyType?: string;
  lifeStage?: string;
  builderMode?: boolean;
}

export interface WarmIntro {
  userId: string;
  targetUserId: string;
  reason: string;
  sharedTraits: string[];
  createdAt: Date;
  status: 'pending' | 'sent' | 'accepted' | 'declined';
}

export class TrustMatchingService {

  /**
   * Generates a warm intro reason between two users using AI.
   * This produces the human-language explanation the companion uses — not a score.
   */
  static async generateWarmIntroReason(
    userProfile: UserProfile,
    targetProfile: UserProfile,
    conversationContext?: string
  ): Promise<string> {
    const groq = getGroqClient();

    const prompt = `You are Kudos, an AI companion that introduces people to each other — not based on profile matches, but on genuine human compatibility.

USER A: ${userProfile.name}
- Personality: ${userProfile.personalityTags?.join(', ') || 'curious, honest'}
- Work style: ${userProfile.workStyle || 'async'}
- Life stage: ${userProfile.lifeStage || 'building'}
- Recent thoughts: ${conversationContext || 'Thinking about building something meaningful'}

USER B: ${targetProfile.name}
- Personality: ${targetProfile.personalityTags?.join(', ') || 'direct, thoughtful'}
- Work style: ${targetProfile.workStyle || 'async'}
- Life stage: ${targetProfile.lifeStage || 'building'}

Write a single, warm, honest sentence (max 25 words) explaining to User A why they might connect with User B.
- Sound like a trusted friend speaking, NOT an algorithm
- Mention 1-2 specific shared traits
- Never use "compatible" or percentage words
- Start with "You both" or something equally personal`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 80,
      });
      return response.choices[0]?.message?.content?.trim() || 
        `You both seem like people who build things that matter and value honest conversations.`;
    } catch (e) {
      return `You both seem like people who build things that matter and value honest conversations.`;
    }
  }

  /**
   * Finds potential warm intros for a user by comparing their profile
   * against other verified users. Returns max 5 intros per call.
   */
  static async findPotentialIntros(userId: string): Promise<any[]> {
    if (!firestoreReady) {
      return TrustMatchingService.getMockIntros(userId);
    }

    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return [];

      const userProfile: UserProfile = { uid: userId, ...userDoc.data() as any };

      // Fetch other users (excluding the current user and already-seen)
      const seenRef = await db.collection('users').doc(userId)
        .collection('seenIntros').get();
      const seenIds = new Set(seenRef.docs.map(d => d.id));
      seenIds.add(userId);

      const otherUsersSnap = await db.collection('users')
        .where('isVerified', '==', true)
        .limit(20)
        .get();

      const candidates = otherUsersSnap.docs
        .filter(d => !seenIds.has(d.id))
        .slice(0, 5);

      const intros = await Promise.all(candidates.map(async (doc) => {
        const targetProfile: UserProfile = { uid: doc.id, ...doc.data() as any };
        const reason = await TrustMatchingService.generateWarmIntroReason(userProfile, targetProfile);
        
        // Derive shared traits
        const userTags = new Set(userProfile.personalityTags || []);
        const shared = (targetProfile.personalityTags || []).filter(t => userTags.has(t));

        return {
          id: doc.id,
          name: targetProfile.name || 'Someone interesting',
          location: targetProfile.location || '',
          bio: targetProfile.bio || '',
          personalityTags: targetProfile.personalityTags || [],
          lookingFor: targetProfile.values?.join(', ') || '',
          companionReason: reason,
          sharedTraits: shared.length > 0 ? shared : ['Building', 'Honest conversations'],
          isOnline: Math.random() > 0.5, // TODO: real presence tracking
          lastSeen: '2h ago',
          builderMode: targetProfile.builderMode || false,
        };
      }));

      return intros;
    } catch (e) {
      console.error('[TrustMatching] Error finding intros:', e);
      return TrustMatchingService.getMockIntros(userId);
    }
  }

  /**
   * Records a "Send Note" action. The companion delivers the intro with context.
   */
  static async sendWarmNote(
    fromUserId: string,
    toUserId: string,
    note: string
  ): Promise<{ success: boolean; introId: string }> {
    const introId = `intro_${Date.now()}`;

    if (firestoreReady) {
      try {
        await db.collection('intros').doc(introId).set({
          fromUserId,
          toUserId,
          note,
          status: 'sent',
          createdAt: new Date(),
        });

        // Mark as seen so we don't re-suggest them
        await db.collection('users').doc(fromUserId)
          .collection('seenIntros').doc(toUserId).set({ at: new Date() });
      } catch (e) {
        console.error('[TrustMatching] Error saving note:', e);
      }
    }

    return { success: true, introId };
  }

  /**
   * Returns mock intros for local/dev mode
   */
  static getMockIntros(excludeUserId: string) {
    return [
      {
        id: 'mock_priya',
        name: 'Priya Sharma',
        location: 'Mumbai, India',
        bio: 'Building things that matter. Love honest conversations at 2am.',
        personalityTags: ['Builder', 'Design-minded', 'Night owl'],
        lookingFor: 'Someone who builds with integrity, not just speed',
        companionReason: 'You both mentioned hating small talk. Priya also stays up late building things. Sound familiar?',
        sharedTraits: ['Night owl', 'Builder'],
        isOnline: true,
        lastSeen: '2h ago',
        builderMode: true,
      },
      {
        id: 'mock_arjun',
        name: 'Arjun Kapoor',
        location: 'Delhi, India',
        bio: 'Serial overthinker. I process life through long conversations.',
        personalityTags: ['Cofounder-minded', 'Technical', 'Risk-taker'],
        lookingFor: 'Real cofounder, not a business partner',
        companionReason: 'You both process life through overthinking. Arjun is the midnight builder type.',
        sharedTraits: ['Overthinker', 'Builder'],
        isOnline: true,
        lastSeen: '10m ago',
        builderMode: true,
      },
      {
        id: 'mock_zara',
        name: 'Zara Ahmed',
        location: 'Dubai, UAE',
        bio: 'Curious about everything. Designer by day, philosopher by night.',
        personalityTags: ['Creative', 'Curious', 'Direct'],
        lookingFor: 'Real connection, maybe something more',
        companionReason: 'You both seem to value depth over small talk and authenticity over performance.',
        sharedTraits: ['Direct', 'Curious'],
        isOnline: false,
        lastSeen: '3h ago',
        builderMode: false,
      },
    ];
  }
}
