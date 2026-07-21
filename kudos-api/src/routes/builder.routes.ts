import { Router } from 'express';
import { ChallengeService } from '../services/challenge.service';
import { verifyAuth } from '../middleware/auth';
import { db, firestoreReady } from '../config/firebase';

const router = Router();

// GET /api/builder/profile — get builder profile
router.get('/profile', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;

    if (!firestoreReady) {
      return res.json({
        profile: {
          enabled: false,
          building: '',
          howYouWork: '',
          whatYouNeed: '',
          isDiscoverable: false,
        }
      });
    }

    const doc = await db.collection('users').doc(userId)
      .collection('builder').doc('profile').get();

    res.json({
      profile: doc.exists
        ? doc.data()
        : { enabled: false, building: '', howYouWork: '', whatYouNeed: '', isDiscoverable: false }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get builder profile' });
  }
});

// PUT /api/builder/profile — update builder profile
router.put('/profile', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { building, howYouWork, whatYouNeed, isDiscoverable } = req.body;

    const profile = {
      enabled: true,
      building: building || '',
      howYouWork: howYouWork || '',
      whatYouNeed: whatYouNeed || '',
      isDiscoverable: isDiscoverable || false,
      updatedAt: new Date(),
    };

    if (firestoreReady) {
      await db.collection('users').doc(userId)
        .collection('builder').doc('profile').set(profile, { merge: true });

      // Also update discoverable flag on main user doc
      await db.collection('users').doc(userId).set({
        builderMode: true,
        isDiscoverable: isDiscoverable || false,
      }, { merge: true });
    }

    res.json({ success: true, profile });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update builder profile' });
  }
});

// POST /api/builder/chemistry-test — start a chemistry test sprint
router.post('/chemistry-test', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { partnerId } = req.body;

    if (!partnerId) return res.status(400).json({ error: 'partnerId required' });

    const result = await ChallengeService.generateChemistryChallenge(userId, partnerId);
    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ error: 'Failed to start chemistry test' });
  }
});

// POST /api/builder/chemistry-test/:sprintId/respond — submit a response
router.post('/chemistry-test/:sprintId/respond', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { sprintId } = req.params;
    const { response } = req.body;

    if (!response) return res.status(400).json({ error: 'Response is required' });

    await ChallengeService.submitChemistryResponse(sprintId, userId, response);
    res.json({ success: true, message: 'Response submitted!' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// GET /api/builder/chemistry-test/:sprintId/results — get results
router.get('/chemistry-test/:sprintId/results', verifyAuth, async (req: any, res: any) => {
  try {
    const { sprintId } = req.params;
    const summary = await ChallengeService.generateChemistrySummary(sprintId);
    res.json({ summary });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get chemistry results' });
  }
});

export default router;
