import { getGroqClient } from '../../config/groq';
import { db, firestoreReady } from '../../config/firebase';
import { PersonalityService, RelationshipMode } from './personality.service';
import { MemoryService } from '../memory/memory.service';
import { SentimentService } from './sentiment.service';

export class ConversationService {
  /**
   * Processes an incoming message and generates a response using Groq.
   */
  static async sendMessage(userId: string, message: string, mode: RelationshipMode = 'cofounder', activeWindow: string = ''): Promise<string> {
    try {
      const groq = getGroqClient();

      // 2. Fetch User Profile
      const userName = 'Founder';

      // 3. Build Context Pipeline
      const [systemPrompt, memoryContext] = await Promise.all([
        PersonalityService.getSystemPrompt(mode, userName),
        MemoryService.getContextMemories(userId)
      ]);

      let fullSystemPrompt = `${systemPrompt}\n\n${memoryContext}`;
      if (activeWindow) {
        fullSystemPrompt += `\n\n[SYSTEM NOTE: The user is currently looking at an application/window titled: "${activeWindow}". Use this for context if relevant.]`;
      }

      // 4. Fetch last 5 messages for conversation history
      let history: any[] = [];
      if (firestoreReady) {
        try {
          const historySnapshot = await db.collection('users').doc(userId)
            .collection('conversations').doc('main')
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();
          history = historySnapshot.docs.map(doc => doc.data()).reverse();
        } catch (err) {
          console.warn('[History] Fetch skipped — Firestore read failed.');
        }
      }
      
      // Build Messages array for Groq
      const messages: any[] = [
        { role: 'system', content: fullSystemPrompt }
      ];

      for (const msg of history) {
        messages.push({
          role: msg.role === 'assistant' || msg.role === 'ai' ? 'assistant' : 'user',
          content: msg.content
        });
      }

      // Add the new message
      messages.push({ role: 'user', content: message });

      // 5. Call Groq API
      let reply = "I'm here for you.";
      try {
        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: messages,
          temperature: 0.7,
        });
        reply = response.choices[0]?.message?.content || "I'm here for you.";
      } catch (apiErr: any) {
        console.error('Groq AI Error (Mocking response instead):', apiErr.message);
        reply = `(Mock AI): I hear you! My AI API is currently throwing an error, but I am listening. You said: "${message}"`;
      }

      // 6. Post-processing (Fire and forget)
      // Save history, extract memories, detect mood
      if (firestoreReady) {
        this.saveHistory(userId, message, reply).catch(e => console.error('[History] Save error:', e.message));
        MemoryService.extractAndStore(userId, message, reply).catch(e => console.error('[Memory] Error:', e.message));
        SentimentService.analyzeAndUpdateState(userId, message).catch(e => console.error('[Sentiment] Error:', e.message));
      } else {
        // Still run sentiment for SSE broadcast (it will skip Firestore write internally)
        SentimentService.analyzeAndUpdateState(userId, message).catch(e => console.error('[Sentiment] Error:', e.message));
      }

      return reply;
    } catch (error) {
      console.error('Conversation Error:', error);
      return "I'm feeling a little disconnected right now, but I'm still here with you. ❤️";
    }
  }

  private static async saveHistory(userId: string, userMsg: string, aiMsg: string) {
    const batch = db.batch();
    const msgsRef = db.collection('users').doc(userId).collection('conversations').doc('main').collection('messages');
    
    batch.set(msgsRef.doc(), {
      role: 'user',
      content: userMsg,
      timestamp: new Date()
    });
    
    batch.set(msgsRef.doc(), {
      role: 'assistant',
      content: aiMsg,
      timestamp: new Date()
    });

    await batch.commit();
  }
}

