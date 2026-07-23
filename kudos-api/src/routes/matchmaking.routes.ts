import { Router } from 'express';
import { db, firestoreReady } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';
import { TrustMatchingService } from '../services/ai/trust-matching.service';
import { SituationExtractorService } from '../services/ai/situation-extractor.service';

const router = Router();

// POST /api/matchmaking/join — join the matching queue
router.post('/join', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;

    if (firestoreReady) {
      const doc = await db.collection('users').doc(userId).get();
      if (!doc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
    }

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

// GET /api/matchmaking/status — get the current user's situation profile
router.get('/status', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;

    if (!firestoreReady) {
      return res.json({
        situationProfile: {
          currentSituation: 'building_alone',
          needType: 'advisor',
          intensity: 6,
          topics: ['startup', 'lonely', 'building'],
          beenThrough: ['first_job', 'freelancing_alone'],
          openToMatch: true,
        },
        inQueue: false,
      });
    }

    const [userDoc, queueDoc] = await Promise.all([
      db.collection('users').doc(userId).get(),
      db.collection('matchmaking').doc(userId).get(),
    ]);

    const situationProfile = userDoc.data()?.situationProfile || null;
    const inQueue = queueDoc.exists && queueDoc.data()?.status === 'searching';

    res.json({ situationProfile, inQueue });
  } catch (e) {
    console.error('[Matchmaking] Status error:', e);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// GET /api/matchmaking/ai-suggestions — AI-driven situation-based match suggestions
router.get('/ai-suggestions', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const intros = await TrustMatchingService.findPotentialIntros(userId);

    // Filter to only high-quality situation matches (advisors first)
    const advisors = intros.filter(i => i.isSituationAdvisor);
    const peers = intros.filter(i => !i.isSituationAdvisor).slice(0, 3);
    
    res.json({
      advisors: advisors.slice(0, 3),
      peers,
      total: intros.length,
    });
  } catch (e) {
    console.error('[Matchmaking] AI suggestions error:', e);
    res.status(500).json({ error: 'Failed to get AI suggestions' });
  }
});

// POST /api/matchmaking/accept/:introId — accept a match intro
router.post('/accept/:introId', verifyAuth, async (req: any, res: any) => {
  try {
    const { introId } = req.params;
    const userId = req.user.uid;
    await TrustMatchingService.acceptIntro(introId, userId);
    res.json({ success: true, message: 'Intro accepted' });
  } catch (e) {
    console.error('[Matchmaking] Accept error:', e);
    res.status(500).json({ error: 'Failed to accept intro' });
  }
});

// POST /api/matchmaking/decline/:introId — decline a match intro
router.post('/decline/:introId', verifyAuth, async (req: any, res: any) => {
  try {
    const { introId } = req.params;
    const userId = req.user.uid;
    await TrustMatchingService.declineIntro(introId, userId);
    res.json({ success: true, message: 'Intro declined' });
  } catch (e) {
    console.error('[Matchmaking] Decline error:', e);
    res.status(500).json({ error: 'Failed to decline intro' });
  }
});

export default router;
