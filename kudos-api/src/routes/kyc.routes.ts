import { Router } from 'express';
import { db } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';

const router = Router();

router.post('/submit', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { fullName, idData } = req.body;
    
    await db.collection('users').doc(userId).set({
      kycStatus: 'pending',
      kycSubmittedAt: new Date().toISOString(),
      fullName
    }, { merge: true });

    res.json({ success: true, message: 'KYC submitted successfully', status: 'pending' });
  } catch (error) {
    console.error('KYC Submit Error:', error);
    res.status(500).json({ error: 'Failed to submit KYC' });
  }
});

router.get('/status', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const doc = await db.collection('users').doc(userId).get();
    
    if (!doc.exists) {
      return res.json({ status: 'unverified' });
    }
    
    const data = doc.data();
    res.json({ status: data?.kycStatus || 'unverified' });
  } catch (error) {
    console.error('KYC Status Error:', error);
    res.status(500).json({ error: 'Failed to get KYC status' });
  }
});

export default router;
