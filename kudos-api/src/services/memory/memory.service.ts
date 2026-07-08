import { getGroqClient } from '../../config/groq';
import { db, firestoreReady } from '../../config/firebase';

export class MemoryService {
  /**
   * Retrieves the top contextual memories for the system prompt.
   */
  static async getContextMemories(userId: string): Promise<string> {
    if (!firestoreReady) return "No memories yet (Firestore offline).";

    try {
      // Future RAG: If Pinecone is configured, we will embed the context and do vector search here.
      // For now, we fetch the 10 most recent from Firestore to maintain compatibility while transitioning.
      const memDocs = await db.collection('users').doc(userId).collection('memories')
        .orderBy('timestamp', 'desc').limit(10).get();
      
      if (memDocs.empty) return "No memories yet.";
      
      const facts = memDocs.docs.map(doc => doc.data().fact);
      return `\n\nMemories about the founder:\n${facts.map(f => `- ${f}`).join('\n')}`;
    } catch (error) {
      console.warn('[Memory] Retrieval error:', error);
      return "";
    }
  }

  /**
   * Analyzes conversation and extracts key facts to store in Firestore and Vector DB.
   */
  static async extractAndStore(userId: string, userMsg: string, aiMsg: string): Promise<void> {
    if (!firestoreReady) return;

    try {
      const groq = getGroqClient();
      
      const prompt = `Analyze this exchange between a startup founder and their AI companion.
Extract any NEW, meaningful facts, preferences, or emotional states about the founder.
If nothing significant is found, reply exactly with "NONE".
Otherwise, reply with a single concise fact sentence.

Founder: ${userMsg}
AI: ${aiMsg}
Fact:`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
      });
      
      const extracted = response.choices[0]?.message?.content?.trim() || 'NONE';

      if (extracted !== 'NONE' && extracted !== '' && !extracted.includes('NONE')) {
        // Store in Firestore
        const docRef = await db.collection('users').doc(userId).collection('memories').add({
          fact: extracted,
          timestamp: new Date()
        });
        console.log(`🧠 New Memory Stored in DB: ${extracted}`);
        
        // RAG Setup (Awaiting Pinecone API Keys):
        // Once STRIPE_SECRET_KEY and PINECONE_API_KEY are configured for production,
        // uncomment the following block to enable scalable Vector DB memory.
        // const embedding = await openai.embeddings.create({ input: extracted, model: "text-embedding-3-small" });
        // await pineconeIndex.upsert([{ id: docRef.id, values: embedding.data[0].embedding, metadata: { userId, text: extracted } }]);
      }
    } catch (error) {
      console.error('[Memory] Extraction error:', error);
    }
  }
}

