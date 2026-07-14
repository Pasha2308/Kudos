import { Router } from 'express';
import { db, firestoreReady } from '../config/firebase';
import { getMemoriesTable } from '../config/lancedb';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// Endpoint: GET /api/memory/summary
router.get('/summary', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = user.uid;

    const localMode = req.query.localMode === 'true';
    let memories: { id: string, fact: string, timestamp: number }[] = [];

    if (localMode || !firestoreReady) {
      const table = await getMemoriesTable(userId);
      if (table) {
        // Fetch top 50 recent memories from LanceDB
        // LanceDB JS API doesn't support basic select all without vector search easily in old versions,
        // but we can search for a blank vector or limit without search if supported.
        // Actually, table.select().limit(50) might work, or we can just return all.
        try {
          const records = await (table as any).query().limit(50).toArray();
          memories = records.map((r: any) => ({
            id: r.id as string,
            fact: r.fact as string,
            timestamp: r.timestamp as number
          }));
        } catch (e) {
          // Fallback if toArray/query fails
          console.warn('LanceDB query error, fallback to empty:', e);
        }
      }
    } else {
      const memDocs = await db.collection('users').doc(userId).collection('memories')
        .orderBy('timestamp', 'desc').limit(50).get();
      
      memories = memDocs.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          fact: data.fact,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now()
        };
      });
    }

    res.json({ memories });
  } catch (error) {
    console.error('Memory Summary Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
