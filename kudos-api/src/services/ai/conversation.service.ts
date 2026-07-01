import { getGeminiModel } from '../../config/gemini';
import { db } from '../../config/firebase';

export class ConversationService {
  /**
   * Send a message to Kudos and get a response.
   * For now, this is a basic integration. We will add memory and personality later.
   */
  static async sendMessage(userId: string, message: string): Promise<string> {
    try {
      // 1. Get the model
      const model = getGeminiModel('gemini-2.0-flash-exp');

      // 2. Build a basic system prompt (will be expanded in AI Brain phase)
      const systemPrompt = `You are Kudos, an AI companion for founders. 
You are currently in 'Partner' mode. Keep your responses short (1-3 sentences), warm, and supportive.
Never say 'As an AI...'. Act like a real, caring partner.`;

      // 3. Call Vertex AI
      const response = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          { role: 'model', parts: [{ text: 'Understood. I am Kudos.' }] },
          { role: 'user', parts: [{ text: message }] }
        ]
      });

      const reply = response.response.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here for you.";

      // 4. Save to Firestore (Fire and forget for speed)
      this.saveToHistory(userId, message, reply).catch(err => 
        console.error('Failed to save chat history:', err)
      );

      return reply;
    } catch (error) {
      console.error('AI Service Error:', error);
      return "I'm feeling a little disconnected right now, but I'm still here with you. ❤️";
    }
  }

  private static async saveToHistory(userId: string, userMsg: string, aiMsg: string) {
    const convoRef = db.collection('users').doc(userId).collection('conversations').doc('main');
    
    // Ensure the conversation document exists
    await convoRef.set({ updatedAt: new Date() }, { merge: true });

    // Add user message
    await convoRef.collection('messages').add({
      role: 'user',
      content: userMsg,
      timestamp: new Date()
    });

    // Add AI message
    await convoRef.collection('messages').add({
      role: 'assistant',
      content: aiMsg,
      timestamp: new Date()
    });
  }
}
