import { Router } from 'express';
import { db, firestoreReady } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// GET /api/profile/me - Get current user profile
router.get('/me', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    if (!firestoreReady) {
      return res.json({ profile: { name: 'Local Founder' } });
    }
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Profile not found' });
    res.json({ profile: doc.data() });
  } catch (error) {
    console.error('Error fetching own profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/profile/:userId - Get public profile
router.get('/:userId', verifyAuth, async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    if (!firestoreReady) {
      return res.json({ profile: { name: 'Mock User', role: 'Builder', tagline: 'Building stuff' } });
    }
    const doc = await db.collection('users').doc(userId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Profile not found' });
    
    const data = doc.data() || {};
    // Only return public fields
    const publicProfile = {
      uid: userId,
      name: data.name,
      photoURL: data.photoURL,
      tagline: data.tagline,
      role: data.role,
      bio: data.bio,
      location: data.location,
      experience: data.experience,
      currentCompany: data.currentCompany,
      personalityTags: data.personalityTags
    };
    
    res.json({ profile: publicProfile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile/me - Update own profile
router.put('/me', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { tagline, role, bio, location, experience, currentCompany, photoURL } = req.body;
    
    const updateData: any = { updatedAt: new Date().toISOString() };
    if (tagline !== undefined) updateData.tagline = tagline;
    if (role !== undefined) updateData.role = role;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    if (experience !== undefined) updateData.experience = experience;
    if (currentCompany !== undefined) updateData.currentCompany = currentCompany;
    if (photoURL !== undefined) updateData.photoURL = photoURL;

    if (firestoreReady) {
      await db.collection('users').doc(userId).set(updateData, { merge: true });
    }

    res.json({ success: true, profile: updateData });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
