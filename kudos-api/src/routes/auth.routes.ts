import { Router } from 'express';
import { db } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// Endpoint: POST /api/auth/register
// Called by the client right after Firebase login to ensure user document exists
router.post('/register', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { email, name } = req.body;
    const userRef = db.collection('users').doc(user.uid);
    
    const doc = await userRef.get();
    if (!doc.exists) {
      await userRef.set({
        email: email || user.email || '',
        name: name || user.name || 'Founder',
        createdAt: new Date(),
        subscriptionTier: 'free'
      });
      res.json({ message: 'User registered', isNew: true });
    } else {
      res.json({ message: 'User already exists', isNew: false, data: doc.data() });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: POST /api/auth/fcm-token
router.post('/fcm-token', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { fcmToken } = req.body;
    if (fcmToken) {
      await db.collection('users').doc(user.uid).update({ fcmToken });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('FCM Token Save Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
