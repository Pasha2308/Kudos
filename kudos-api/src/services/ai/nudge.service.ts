import { getGroqClient } from '../../config/groq';
import { db, firestoreReady } from '../../config/firebase';
import { MemoryService } from '../memory/memory.service';
import ollama from 'ollama';

export class NudgeService {
  /**
   * Generates a proactive nudge message based on the user's current mood and memories.
   */
  static async generateProactiveNudge(userId: string, activeWindow: string = '', localMode: boolean = false): Promise<string> {
    try {
      // 1. Get recent memory context
      const memoryContext = await MemoryService.getContextMemories(userId, "", localMode);

      // 2. Get current mood from Firestore (if available and not in strict local mode)
      let currentEmotion = 'neutral';
      if (firestoreReady && !localMode) {
        try {
          const stateDoc = await db.collection('users').doc(userId).collection('pet_state').doc('current').get();
          if (stateDoc.exists) {
            currentEmotion = stateDoc.data()?.emotion || 'neutral';
          }
        } catch (err) {
          console.warn('[Nudge] Could not fetch pet state, defaulting to neutral');
        }
      }

      // 3. Prompt for the nudge
      let activeWindowContext = '';
      if (activeWindow) {
        activeWindowContext = `They are currently looking at an application/window titled: "${activeWindow}". Mention this context if relevant, but don't be creepy.`;
      }

      const prompt = `You are a supportive AI companion for a startup founder.
The founder hasn't spoken to you in a while. You are going to send them a proactive "nudge" (a short message to check in).

Current known emotion of the founder: ${currentEmotion}
${memoryContext}
${activeWindowContext}

Rules:
1. Keep it very short (1-2 sentences).
2. If they are 'tired' or 'stressed', encourage them to take a break or hydrate.
3. If they are 'focused', tell them they are doing great but don't interrupt too much.
4. If 'happy', celebrate with them.
5. Do NOT ask them how you can help. Just be a supportive presence.
6. Write the message as if you are talking to them right now.`;

      let nudge = "Just checking in on you! Make sure to stay hydrated.";

      if (localMode) {
        const response = await ollama.chat({
          model: 'llama3',
          messages: [{ role: 'user', content: prompt }],
          options: { temperature: 0.7 }
        });
        nudge = response.message.content.trim() || nudge;
      } else {
        const groq = getGroqClient();
        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        });
        nudge = response.choices[0]?.message?.content?.trim() || nudge;
      }

      return nudge;
    } catch (err: any) {
      console.error('[Nudge] Generation error:', err);
      return "I'm always here watching you build! You got this.";
    }
  }
}
