import { getGroqClient } from '../../config/groq';
import { db, firestoreReady } from '../../config/firebase';
import { PersonalityService, RelationshipMode } from './personality.service';
import { MemoryService } from '../memory/memory.service';

import ollama from 'ollama';
import { SentimentService } from './sentiment.service';
import { SSEService } from '../sse.service';
import { LocalHistory } from '../memory/local-history';

export class ConversationService {

  /**
   * Processes an incoming message and generates a response using Groq or local Ollama.
   */
  static async sendMessage(userId: string, message: string, mode: RelationshipMode = 'cofounder', activeWindow: string = '', localMode: boolean = false): Promise<string> {
    try {
      const groq = getGroqClient();

      // 2. Fetch User Profile
      const userName = 'Founder';

      // 3. Build Context Pipeline
      const [systemPrompt, memoryContext] = await Promise.all([
        PersonalityService.getSystemPrompt(mode, userName),
        MemoryService.getContextMemories(userId, message, localMode)
      ]);

      let fullSystemPrompt = `${systemPrompt}\n\n${memoryContext}`;
      if (activeWindow) {
        fullSystemPrompt += `\n\n[SYSTEM NOTE: The user is currently looking at an application/window titled: "${activeWindow}". Use this for context if relevant.]`;
      }

      // 4. Fetch last 20 messages for conversation history
      let history: any[] = [];
      if (firestoreReady) {
        try {
          const historySnapshot = await db.collection('users').doc(userId)
            .collection('conversations').doc('main')
            .collection('messages')
            .orderBy('timestamp', 'desc')
            .limit(20)
            .get();
          history = historySnapshot.docs.map(doc => doc.data()).reverse();
        } catch (err) {
          console.warn('[History] Fetch skipped — Firestore read failed. Using local fallback.');
          history = LocalHistory.getHistory().slice(-20);
        }
      } else {
        history = LocalHistory.getHistory().slice(-20);
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

      // 5. Call LLM API (Groq or Ollama)
      let reply = "I'm here for you.";
      try {
        if (localMode) {
          const response = await ollama.chat({
            model: 'llama3', // Adjust based on installed local model
            messages: messages,
          });
          reply = response.message.content || reply;
        } else {
          const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            temperature: 0.7,
          });
          reply = response.choices[0]?.message?.content || reply;
        }
      } catch (apiErr: any) {
        console.error('AI API Error (Mocking response instead):', apiErr.message);
        reply = `(Mock AI): I hear you! My API is currently throwing an error, but I am listening. You said: "${message}"`;
      }

      // 6. Post-processing (Fire and forget)
      // Broadcast messages to all connected clients (Mobile and Desktop) via SSE
      SSEService.broadcast('chat-message', { role: 'user', content: message, ts: Date.now() - 1 });
      SSEService.broadcast('chat-message', { role: 'assistant', content: reply, ts: Date.now() });

      // Save to local fallback
      LocalHistory.addMessage({ role: 'user', content: message, timestamp: new Date(Date.now() - 1) });
      LocalHistory.addMessage({ role: 'assistant', content: reply, timestamp: new Date() });

      // Save history, extract memories, detect mood
      if (firestoreReady && !localMode) {
        this.saveHistory(userId, message, reply).catch(e => console.error('[History] Save error:', e.message));
      }
      
      // Always extract memories (MemoryService will handle Cloud vs Local routing)
      MemoryService.extractAndStore(userId, message, reply, localMode).catch(e => console.error('[Memory] Error:', e.message));
      
      if (firestoreReady && !localMode) {
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

  public static async getHistory(userId: string): Promise<any[]> {
    if (firestoreReady) {
      try {
        const historySnapshot = await db.collection('users').doc(userId)
          .collection('conversations').doc('main')
          .collection('messages')
          .orderBy('timestamp', 'desc')
          .limit(20)
          .get();
        return historySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            ts: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now()
          };
        }).reverse();
      } catch (err) {
        return LocalHistory.getHistory().map((h: any) => ({ ...h, ts: h.timestamp.getTime() })).slice(-20);
      }
    }
    return LocalHistory.getHistory().map((h: any) => ({ ...h, ts: h.timestamp.getTime() })).slice(-20);
  }
}
