import { Router } from 'express';
import { db } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';
import { SSEService } from '../services/sse.service';

const router = Router();

// GET /api/user/preferences
router.get('/preferences', verifyAuth, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const doc = await db.collection('users').doc(userId).collection('settings').doc('preferences').get();
    
    if (!doc.exists) {
      return res.json({ 
        preferences: {
          theme: 'dark',
          persona: 'cofounder',
          avatar: 'anime-glasses'
        }
      });
    }

    res.json({ preferences: doc.data() });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/user/preferences
router.put('/preferences', verifyAuth, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const { theme, persona, avatar } = req.body;
    
    const newPrefs = { theme, persona, avatar, updatedAt: new Date().toISOString() };
    
    // Clean undefined fields
    Object.keys(newPrefs).forEach(key => (newPrefs as any)[key] === undefined && delete (newPrefs as any)[key]);

    await db.collection('users').doc(userId).collection('settings').doc('preferences').set(newPrefs, { merge: true });

    // Broadcast the update via SSE to all connected clients for this user
    SSEService.emitToUser(userId, 'preferences-updated', newPrefs);

    res.json({ success: true, preferences: newPrefs });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
