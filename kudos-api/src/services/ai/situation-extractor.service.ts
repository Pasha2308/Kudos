import { getGroqClient } from '../../config/groq';
import { db, firestoreReady } from '../../config/firebase';

export type SituationType =
  // Startup
  | 'cofounder_conflict' | 'fundraising_stress' | 'near_shutdown' | 'first_hire'
  | 'product_pivot' | 'first_revenue' | 'launch_failed' | 'scaling_chaos' | 'building_alone'
  // Career
  | 'job_loss' | 'career_pivot' | 'toxic_workplace' | 'burnout' | 'first_job' | 'freelancing_alone'
  // Social / Personal
  | 'loneliness' | 'breakup' | 'new_city' | 'lost_friendship' | 'family_conflict' | 'grief'
  | 'feeling_misunderstood'
  // Life Stage
  | 'quarter_life_crisis' | 'major_decision_paralysis' | 'new_parent' | 'health_scare'
  // Mental
  | 'depression_dip' | 'anxiety_spiral' | 'imposter_syndrome' | 'motivation_crash'
  // Positive / Connection-seeking
  | 'celebrating_win' | 'seeking_accountability' | 'want_connection' | 'want_mentor' | 'want_advisor'
  | 'none';

export type NeedType =
  | 'advisor'        // someone who has been through the same situation
  | 'peer'           // someone going through the same thing right now
  | 'mentor'         // experienced person who can guide
  | 'accountability' // someone to check in and keep them going
  | 'friend'         // just a real connection, no agenda
  | 'partner'        // romantic or close partner connection
  | 'none';

export interface SituationProfile {
  currentSituation: SituationType;
  needType: NeedType;
  intensity: number; // 1-10, how urgent/intense
  topics: string[];  // raw keywords extracted
  beenThrough: SituationType[]; // accumulated lifetime experiences
  openToMatch: boolean;
  lastUpdated: Date;
}

export class SituationExtractorService {

  /**
   * Analyzes a chat message and extracts the user's current situation.
   * Runs in the background — fire and forget.
   */
  static async extractAndUpdate(userId: string, userMessage: string): Promise<void> {
    try {
      const groq = getGroqClient();

      const prompt = `You are a silent observer analyzing a message from a user on a social connection app called Kudos. 
Your job is to extract structured situation data from their message so we can find the right human for them to connect with.

Message: "${userMessage}"

Extract and respond with ONLY valid JSON (no markdown, no explanation):
{
  "currentSituation": "<one of: cofounder_conflict|fundraising_stress|near_shutdown|first_hire|product_pivot|first_revenue|launch_failed|scaling_chaos|building_alone|job_loss|career_pivot|toxic_workplace|burnout|first_job|freelancing_alone|loneliness|breakup|new_city|lost_friendship|family_conflict|grief|feeling_misunderstood|quarter_life_crisis|major_decision_paralysis|new_parent|health_scare|depression_dip|anxiety_spiral|imposter_syndrome|motivation_crash|celebrating_win|seeking_accountability|want_connection|want_mentor|want_advisor|none>",
  "needType": "<one of: advisor|peer|mentor|accountability|friend|partner|none>",
  "intensity": <number 1-10>,
  "topics": ["<keyword>", "<keyword>"],
  "beenThrough": ["<past situations mentioned, same enum values>"],
  "openToMatch": <true if user seems open to connecting with someone, false if just venting>
}

Rules:
- currentSituation: pick the SINGLE best match. Use 'none' if the message is casual.
- needType: 'advisor' if they need someone who HAS BEEN THROUGH IT. 'peer' if they want someone going through the same now. 'mentor' for guidance. 'accountability' if they need a check-in partner. 'friend' for general connection. 'partner' for romantic. 'none' if unclear.
- beenThrough: ONLY include situations explicitly mentioned as past events (e.g. "last year I went through...").
- openToMatch: true if they express desire for connection or would benefit from someone, false if purely venting.
- intensity: how emotionally charged is the message. 1=casual, 10=crisis.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 300,
      });

      const raw = response.choices[0]?.message?.content?.trim() || '{}';
      
      let extracted: Partial<SituationProfile> = {};
      try {
        // Clean up any markdown wrapping
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        extracted = JSON.parse(cleaned);
      } catch {
        console.warn('[SituationExtractor] Failed to parse JSON response:', raw);
        return;
      }

      if (!extracted.currentSituation || extracted.currentSituation === 'none') return;

      // Merge with existing profile in Firestore
      if (firestoreReady) {
        try {
          const userRef = db.collection('users').doc(userId);
          const userDoc = await userRef.get();
          const existing = userDoc.data()?.situationProfile || {};
          const existingBeenThrough: SituationType[] = existing.beenThrough || [];

          // Accumulate beenThrough — never remove past experiences
          const newBeenThrough = extracted.beenThrough || [];
          const mergedBeenThrough = Array.from(new Set([...existingBeenThrough, ...newBeenThrough]));

          // If this situation has intensity >= 6, add it to beenThrough eventually
          // (threshold prevents adding low-intensity casual mentions)
          const situationMentioned = extracted.currentSituation;
          if (extracted.intensity && extracted.intensity >= 6) {
            if (!mergedBeenThrough.includes(situationMentioned as SituationType)) {
              // Add to beenThrough only if intensity is high enough (they're really in it)
              // Don't add current situation to beenThrough yet - only after they move past it
            }
          }

          const updatedProfile: SituationProfile = {
            currentSituation: (extracted.currentSituation as SituationType) || 'none',
            needType: (extracted.needType as NeedType) || 'none',
            intensity: extracted.intensity || 5,
            topics: extracted.topics || [],
            beenThrough: mergedBeenThrough,
            openToMatch: extracted.openToMatch ?? true,
            lastUpdated: new Date(),
          };

          await userRef.set({
            situationProfile: updatedProfile,
            updatedAt: new Date(),
          }, { merge: true });

          console.log(`[SituationExtractor] Updated profile for ${userId}: ${updatedProfile.currentSituation} (intensity: ${updatedProfile.intensity})`);
        } catch (e) {
          console.error('[SituationExtractor] Firestore write error:', e);
        }
      } else {
        // Local dev: just log what we would have saved
        console.log(`[SituationExtractor] (Mock) Situation: ${extracted.currentSituation}, Need: ${extracted.needType}, Intensity: ${extracted.intensity}`);
      }
    } catch (error) {
      // Never throw — this is a background enrichment task
      console.error('[SituationExtractor] Error:', error);
    }
  }

  /**
   * When a user's situation improves (e.g., they say "we resolved the conflict"),
   * moves the current situation to beenThrough and clears current.
   */
  static async markSituationResolved(userId: string, situation: SituationType): Promise<void> {
    if (!firestoreReady) return;
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      const existing = userDoc.data()?.situationProfile || {};
      const existingBeenThrough: SituationType[] = existing.beenThrough || [];

      if (!existingBeenThrough.includes(situation)) {
        existingBeenThrough.push(situation);
      }

      await userRef.set({
        situationProfile: {
          ...existing,
          currentSituation: 'none',
          beenThrough: existingBeenThrough,
          lastUpdated: new Date(),
        }
      }, { merge: true });
    } catch (e) {
      console.error('[SituationExtractor] markSituationResolved error:', e);
    }
  }

  /**
   * Returns the human-readable label for a situation type
   */
  static getSituationLabel(situation: SituationType): string {
    const labels: Record<SituationType, string> = {
      cofounder_conflict: 'Cofounder Conflict',
      fundraising_stress: 'Fundraising Stress',
      near_shutdown: 'Near Shutdown',
      first_hire: 'First Hire',
      product_pivot: 'Product Pivot',
      first_revenue: 'First Revenue',
      launch_failed: 'Launch Failed',
      scaling_chaos: 'Scaling Chaos',
      building_alone: 'Building Alone',
      job_loss: 'Job Loss',
      career_pivot: 'Career Pivot',
      toxic_workplace: 'Toxic Workplace',
      burnout: 'Burnout',
      first_job: 'First Job',
      freelancing_alone: 'Freelancing Alone',
      loneliness: 'Feeling Lonely',
      breakup: 'Breakup',
      new_city: 'New City',
      lost_friendship: 'Lost Friendship',
      family_conflict: 'Family Conflict',
      grief: 'Grief',
      feeling_misunderstood: 'Feeling Misunderstood',
      quarter_life_crisis: 'Quarter-Life Crisis',
      major_decision_paralysis: 'Big Decision',
      new_parent: 'New Parent',
      health_scare: 'Health Scare',
      depression_dip: 'Depression Dip',
      anxiety_spiral: 'Anxiety',
      imposter_syndrome: 'Imposter Syndrome',
      motivation_crash: 'Lost Motivation',
      celebrating_win: 'Celebrating a Win',
      seeking_accountability: 'Seeking Accountability',
      want_connection: 'Want Connection',
      want_mentor: 'Want a Mentor',
      want_advisor: 'Want an Advisor',
      none: 'General',
    };
    return labels[situation] || situation;
  }
}
