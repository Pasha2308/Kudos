import { getGroqClient } from '../../config/groq';
import { db, firestoreReady } from '../../config/firebase';
import ollama from 'ollama';
import { getMemoriesTable } from '../../config/lancedb';

export class MemoryService {
  /**
   * Retrieves the top contextual memories for the system prompt using Semantic Search (RAG) or fallback.
   */
  static async getContextMemories(userId: string, query: string, localMode: boolean = false): Promise<string> {
    try {
      if (localMode || !firestoreReady) {
        // LOCAL RAG (LanceDB + Ollama Embeddings)
        const table = await getMemoriesTable(userId);
        if (!table) return "No memories yet.";

        const queryEmbeddingResponse = await ollama.embeddings({
          model: 'nomic-embed-text',
          prompt: query,
        });

        // Search LanceDB
        const results = await table.search(queryEmbeddingResponse.embedding)
          .limit(5)
          .execute();

        if (!results || results.length === 0) return "No memories yet.";
        
        const facts = results.map(r => r.fact);
        return `\n\nMemories about the founder (Retrieved locally):\n${facts.map(f => `- ${f}`).join('\n')}`;
      } else {
        // CLOUD FALLBACK (Firestore recent memories)
        if (!firestoreReady) return "No memories yet (Firestore offline).";
        
        const memDocs = await db.collection('users').doc(userId).collection('memories')
          .orderBy('timestamp', 'desc').limit(10).get();
        
        if (memDocs.empty) return "No memories yet.";
        
        const facts = memDocs.docs.map(doc => doc.data().fact);
        return `\n\nMemories about the founder:\n${facts.map(f => `- ${f}`).join('\n')}`;
      }
    } catch (error) {
      console.warn('[Memory] Retrieval error:', error);
      return "";
    }
  }

  /**
   * Analyzes conversation and extracts key facts to store in Firestore or Vector DB.
   */
  static async extractAndStore(userId: string, userMsg: string, aiMsg: string, localMode: boolean = false): Promise<void> {
    try {
      const prompt = `Analyze this exchange between a startup founder and their AI companion.
Extract any NEW, meaningful facts, preferences, or emotional states about the founder.
If nothing significant is found, reply exactly with "NONE".
Otherwise, reply with a single concise fact sentence.

Founder: ${userMsg}
AI: ${aiMsg}
Fact:`;

      let extracted = 'NONE';

      if (localMode) {
        // Local extraction using Ollama
        const response = await ollama.chat({
          model: 'llama3',
          messages: [{ role: 'user', content: prompt }],
          options: { temperature: 0.1 }
        });
        extracted = response.message.content.trim();
      } else {
        // Cloud extraction using Groq
        const groq = getGroqClient();
        const response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        });
        extracted = response.choices[0]?.message?.content?.trim() || 'NONE';
      }

      if (extracted !== 'NONE' && extracted !== '' && !extracted.includes('NONE')) {
        console.log(`[Memory] New Fact Extracted: ${extracted}`);
        
        if (localMode || !firestoreReady) {
          // Embed and store in Local LanceDB
          const table = await getMemoriesTable(userId);
          const embeddingResponse = await ollama.embeddings({
            model: 'nomic-embed-text',
            prompt: extracted
          });

          const record = {
            id: Date.now().toString(),
            vector: embeddingResponse.embedding,
            fact: extracted,
            timestamp: Date.now()
          };

          if (table) {
            await table.add([record]);
          } else {
            // First time: Create table by passing data
            const connection = await (await import('../../config/lancedb')).getLanceDB();
            const tableName = `memories_${userId.replace(/[^a-zA-Z0-9]/g, '_')}`;
            await connection.createTable(tableName, [record]);
          }
          console.log(`[LanceDB] Memory Stored Locally.`);
        } else {
          // Store in Cloud Firestore
          await db.collection('users').doc(userId).collection('memories').add({
            fact: extracted,
            timestamp: new Date()
          });
          console.log(`[Firestore] Memory Stored in Cloud.`);
        }
      }
    } catch (error) {
      console.error('[Memory] Extraction error:', error);
    }
  }
}
