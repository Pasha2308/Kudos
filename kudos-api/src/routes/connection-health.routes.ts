import { Router } from 'express';
import { ConnectionHealthService } from '../services/connection-health.service';
import { ChallengeService } from '../services/challenge.service';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// GET /api/health/score — get connection health score
router.get('/score', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const score = await ConnectionHealthService.getScore(userId);
    res.json({ score });
  } catch (e) {
    console.error('[Health] Error:', e);
    res.status(500).json({ error: 'Failed to get health score' });
  }
});

// GET /api/health/challenge — get today's challenge + weekly progress
router.get('/challenge', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const data = await ChallengeService.getWeeklyProgress(userId);
    res.json(data);
  } catch (e) {
    console.error('[Health] Challenge error:', e);
    res.status(500).json({ error: 'Failed to get challenge' });
  }
});

// POST /api/health/challenge/complete — mark today's challenge complete
router.post('/challenge/complete', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { challengeId } = req.body;

    if (!challengeId) return res.status(400).json({ error: 'challengeId required' });

    await ChallengeService.completeChallenge(userId, challengeId);
    await ConnectionHealthService.incrementStreak(userId);

    res.json({ success: true, message: 'Challenge completed! Streak updated.' });
  } catch (e) {
    console.error('[Health] Complete challenge error:', e);
    res.status(500).json({ error: 'Failed to complete challenge' });
  }
});

// POST /api/health/irl-meetup — record an IRL meetup
router.post('/irl-meetup', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    await ConnectionHealthService.recordIRLMeetup(userId);
    res.json({ success: true, message: 'IRL meetup recorded! 🎉' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to record meetup' });
  }
});

export default router;
