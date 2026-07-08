import { getGroqClient } from '../../config/groq';
import { db, firestoreReady } from '../../config/firebase';
import { SSEService } from '../sse.service';

export class SentimentService {
  /**
   * Analyzes message and updates the pet's visual state in Firestore
   */
  static async analyzeAndUpdateState(userId: string, userMsg: string): Promise<string> {
    try {
      const groq = getGroqClient();
      
      const prompt = `Analyze the sentiment of this message from a startup founder.
Categorize the mood into one of the following states: 
'happy', 'stressed', 'sad', 'excited', 'focused', 'tired', 'neutral'.

Only reply with the single word that best fits.
Message: "${userMsg}"`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });
      
      const mood = response.choices[0]?.message?.content?.trim().toLowerCase() || 'neutral';
      
      // Save state so the desktop pet can pull it (only if Firestore is available)
      if (firestoreReady) {
        await db.collection('users').doc(userId).collection('pet_state').doc('current').set({
          emotion: mood,
          lastUpdated: new Date()
        });
      }

      // Broadcast immediately to the connected UI (always works)
      SSEService.broadcast('emotion', mood);

      console.log(`🎭 Mood updated to: ${mood}`);
      return mood;
    } catch (error) {
      console.error('[Sentiment] Analysis error:', error);
      return 'neutral';
    }
  }
}

