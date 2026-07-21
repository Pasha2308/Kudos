import { Router } from 'express';
import { db } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// Universal search endpoint
router.get('/', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { q } = req.query;
    
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ results: { humans: [], rooms: [], messages: [] } });
    }

    const queryStr = q.toLowerCase();
    
    // In a real production app, we would use Algolia or Typesense for full-text search.
    // For this MVP, we do basic prefix matching or client-side filtering after pulling limited docs.
    
    // 1. Search Humans
    const humansSnap = await db.collection('users')
      .where('settings.privacySearchable', '!=', false) // assuming searchable by default
      .limit(10)
      .get();
      
    const humans = humansSnap.docs
      .map(d => ({ id: d.id, ...d.data(), type: 'human' }))
      .filter((h: any) => h.name?.toLowerCase().includes(queryStr) || h.email?.toLowerCase().includes(queryStr));

    // 2. Search Rooms
    const roomsSnap = await db.collection('rooms')
      .limit(10)
      .get();
      
    const rooms = roomsSnap.docs
      .map(d => ({ id: d.id, ...d.data(), type: 'room' }))
      .filter((r: any) => r.name?.toLowerCase().includes(queryStr));

    res.json({
      results: {
        humans,
        rooms
      }
    });
  } catch (error) {
    console.error('Search Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
