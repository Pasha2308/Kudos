import { Router } from 'express';
import { db } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';

const router = Router();

router.post('/join', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const doc = await db.collection('users').doc(userId).get();
    
    if (!doc.exists || doc.data()?.kycStatus !== 'approved') {
      return res.status(403).json({ error: 'Forbidden: KYC must be approved to join matchmaking.' });
    }

    // Mock matchmaking logic
    await db.collection('matchmaking').doc(userId).set({
      status: 'searching',
      joinedAt: new Date().toISOString()
    });

    res.json({ success: true, message: 'Joined matchmaking queue', status: 'searching' });
  } catch (error) {
    console.error('Matchmaking Join Error:', error);
    res.status(500).json({ error: 'Failed to join matchmaking' });
  }
});

export default router;
