import { getGroqClient } from '../../config/groq';
import { db, firestoreReady } from '../../config/firebase';
import { SituationType, NeedType, SituationExtractorService } from './situation-extractor.service';

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
  plan?: 'free' | 'pro' | 'elite';
  badges?: string[];
  photoURL?: string;
  role?: string;
  tagline?: string;
  situationProfile?: {
    currentSituation: SituationType;
    needType: NeedType;
    intensity: number;
    topics: string[];
    beenThrough: SituationType[];
    openToMatch: boolean;
    lastUpdated: Date;
  };
}

export interface WarmIntro {
  userId: string;
  targetUserId: string;
  reason: string;
  sharedTraits: string[];
  situationMatch?: string;
  createdAt: Date;
  status: 'pending' | 'sent' | 'accepted' | 'declined';
}

export class TrustMatchingService {

  /**
   * Generates a warm intro reason between two users using AI.
   * Now situation-aware — if there's a situation match, the intro references it.
   */
  static async generateWarmIntroReason(
    userProfile: UserProfile,
    targetProfile: UserProfile,
    conversationContext?: string
  ): Promise<string> {
    const groq = getGroqClient();

    const userSituation = userProfile.situationProfile?.currentSituation;
    const targetBeenThrough = targetProfile.situationProfile?.beenThrough || [];
    const situationMatch = userSituation && targetBeenThrough.includes(userSituation);

    const situationContext = situationMatch
      ? `\nCRITICAL CONTEXT: User A is currently going through "${SituationExtractorService.getSituationLabel(userSituation as SituationType)}". User B has been through this same situation before. Reference this in your intro — it is the CORE reason for the connection.`
      : '';

    const prompt = `You are Kudos, an AI companion that introduces people to each other — not based on profile matches, but on genuine human compatibility.

USER A: ${userProfile.name}
- Personality: ${userProfile.personalityTags?.join(', ') || 'curious, honest'}
- Work style: ${userProfile.workStyle || 'async'}
- Life stage: ${userProfile.lifeStage || 'building'}
- Recent thoughts: ${conversationContext || 'Thinking about building something meaningful'}
- Current situation: ${userSituation ? SituationExtractorService.getSituationLabel(userSituation as SituationType) : 'General'}

USER B: ${targetProfile.name}
- Personality: ${targetProfile.personalityTags?.join(', ') || 'direct, thoughtful'}
- Work style: ${targetProfile.workStyle || 'async'}
- Life stage: ${targetProfile.lifeStage || 'building'}
- Has been through: ${targetBeenThrough.map(s => SituationExtractorService.getSituationLabel(s)).join(', ') || 'Many things'}
${situationContext}

Write a single, warm, honest sentence (max 30 words) explaining to User A why they might connect with User B.
- Sound like a trusted friend speaking, NOT an algorithm
- If there's a situation match, lead with that — e.g. "Rahul went through a cofounder conflict in 2023..."
- Never use "compatible" or percentage words
- Start with the person's name`;

    try {
      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        max_tokens: 100,
      });
      return response.choices[0]?.message?.content?.trim() ||
        `You both seem like people who build things that matter and value honest conversations.`;
    } catch (e) {
      return `You both seem like people who build things that matter and value honest conversations.`;
    }
  }

  /**
   * Finds potential warm intros for a user.
   * Priority order:
   * 1. Users whose beenThrough[] matches the current user's currentSituation (situation advisors)
   * 2. Users currently in the same situation (peers)
   * 3. Personality-based fallback
   */
  static async findPotentialIntros(userId: string, filter?: string): Promise<any[]> {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return TrustMatchingService.getMockIntros(userId);

      const userProfile: UserProfile = { uid: userId, ...userDoc.data() as any };
      const userSituation = userProfile.situationProfile?.currentSituation;
      const userNeedType = userProfile.situationProfile?.needType;

      // Fetch seen intros to exclude
      let seenIds = new Set<string>([userId]);
      try {
        const seenRef = await db.collection('users').doc(userId).collection('seenIntros').get();
        seenRef.docs.forEach(d => seenIds.add(d.id));
      } catch {}

      // Fetch candidates
      const otherUsersSnap = await db.collection('users')
        .where('onboardingComplete', '==', true)
        .limit(50)
        .get();

      let candidates = otherUsersSnap.docs
        .filter(d => !seenIds.has(d.id))
        .map(doc => ({ uid: doc.id, ...doc.data() as any } as UserProfile));

      // Apply UI filter
      if (filter && filter !== 'all') {
        candidates = candidates.filter(c => {
          if (filter === 'builders') return c.builderMode || c.role?.toLowerCase().includes('founder');
          if (filter === 'advisors') return c.badges?.includes('advisor');
          if (filter === 'cofounder_conflict') return c.situationProfile?.beenThrough?.includes('cofounder_conflict');
          if (filter === 'fundraising') return c.situationProfile?.beenThrough?.includes('fundraising_stress');
          if (filter === 'loneliness') return c.situationProfile?.currentSituation === 'loneliness' || c.situationProfile?.beenThrough?.includes('loneliness');
          if (filter === 'burnout') return c.situationProfile?.beenThrough?.includes('burnout');
          return true;
        });
      }

      // Score and sort candidates
      const scored = candidates.map(target => {
        let score = 0;
        const targetSituation = target.situationProfile;

        // Highest priority: target has BEEN THROUGH user's current situation
        if (userSituation && targetSituation?.beenThrough?.includes(userSituation)) {
          score += 100;
        }
        // High priority: target is currently in same situation (peer match)
        if (userSituation && targetSituation?.currentSituation === userSituation) {
          score += 70;
        }
        // Personality overlap
        const userTags = new Set(userProfile.personalityTags || []);
        const sharedTags = (target.personalityTags || []).filter(t => userTags.has(t));
        score += sharedTags.length * 10;
        // Online bonus
        score += Math.random() * 5; // small random noise to vary order

        return { profile: target, score, sharedTags };
      });

      scored.sort((a, b) => b.score - a.score);
      const top = scored.slice(0, 10);

      const intros = await Promise.all(top.map(async ({ profile: target, sharedTags }) => {
        const reason = await TrustMatchingService.generateWarmIntroReason(userProfile, target);
        const targetBeenThrough = target.situationProfile?.beenThrough || [];
        const isSituationAdvisor = userSituation ? targetBeenThrough.includes(userSituation) : false;

        return {
          id: target.uid,
          name: target.name || 'Someone interesting',
          location: target.location || '',
          bio: target.bio || '',
          personalityTags: target.personalityTags || [],
          lookingFor: target.values?.join(', ') || '',
          companionReason: reason,
          sharedTraits: sharedTags.length > 0 ? sharedTags : ['Building', 'Honest conversations'],
          photoURL: target.photoURL || '',
          role: target.role || 'Founder',
          tagline: target.tagline || '',
          isOnline: Math.random() > 0.4,
          lastSeen: ['2m ago', '15m ago', '1h ago', '3h ago'][Math.floor(Math.random() * 4)],
          builderMode: target.builderMode || false,
          plan: target.plan || 'free',
          badges: target.badges || [],
          isSituationAdvisor,
          situationLabel: isSituationAdvisor && userSituation
            ? SituationExtractorService.getSituationLabel(userSituation)
            : null,
          beenThrough: targetBeenThrough.map(s => SituationExtractorService.getSituationLabel(s as SituationType)),
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

        // Mark as seen
        await db.collection('users').doc(fromUserId)
          .collection('seenIntros').doc(toUserId).set({ at: new Date() });
      } catch (e) {
        console.error('[TrustMatching] Error saving note:', e);
      }
    }

    return { success: true, introId };
  }

  /**
   * Accept a match intro
   */
  static async acceptIntro(introId: string, userId: string): Promise<void> {
    if (!firestoreReady) return;
    try {
      await db.collection('intros').doc(introId).set({ status: 'accepted', acceptedAt: new Date() }, { merge: true });
    } catch (e) {
      console.error('[TrustMatching] acceptIntro error:', e);
    }
  }

  /**
   * Decline a match intro
   */
  static async declineIntro(introId: string, userId: string): Promise<void> {
    if (!firestoreReady) return;
    try {
      await db.collection('intros').doc(introId).set({ status: 'declined', declinedAt: new Date() }, { merge: true });
    } catch (e) {
      console.error('[TrustMatching] declineIntro error:', e);
    }
  }

  /**
   * Returns mock intros for local/dev mode
   */
  static getMockIntros(excludeUserId: string) {
    return [
      {
        id: 'mock_rahul',
        name: 'Rahul Mehta',
        location: 'Bangalore, India',
        bio: 'Survived a cofounder split in 2023. Built the company back to profitability alone.',
        personalityTags: ['Builder', 'Resilient', 'Direct'],
        lookingFor: 'Someone who needs honest advice from someone who\'s been there',
        companionReason: 'Rahul went through a cofounder conflict last year and rebuilt alone — he might know exactly what you need to hear right now.',
        sharedTraits: ['Builder', 'Direct'],
        isOnline: true,
        lastSeen: '5m ago',
        builderMode: true,
        photoURL: '',
        role: 'Founder',
        tagline: 'Survived a cofounder split',
        plan: 'elite',
        badges: ['advisor', 'verified_founder'],
        isSituationAdvisor: true,
        situationLabel: 'Cofounder Conflict',
        beenThrough: ['Cofounder Conflict', 'Near Shutdown', 'First Revenue'],
      },
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
        photoURL: '',
        role: 'Designer & Founder',
        tagline: 'Building things that matter',
        plan: 'pro',
        badges: ['trusted'],
        isSituationAdvisor: false,
        situationLabel: null,
        beenThrough: ['First Revenue', 'Freelancing Alone'],
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
        photoURL: '',
        role: 'CTO & Builder',
        tagline: 'Looking for mission-driven cofounder',
        plan: 'pro',
        badges: ['trusted'],
        isSituationAdvisor: false,
        situationLabel: null,
        beenThrough: ['Burnout', 'Building Alone'],
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
        photoURL: '',
        role: 'Product Designer',
        tagline: 'Depth over breadth, always',
        plan: 'free',
        badges: [],
        isSituationAdvisor: false,
        situationLabel: null,
        beenThrough: ['Feeling Misunderstood', 'Career Pivot'],
      },
    ];
  }
}
