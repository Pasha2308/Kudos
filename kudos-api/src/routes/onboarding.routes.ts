import { Router } from 'express';
import { OnboardingService } from '../services/ai/onboarding.service';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// GET /api/onboarding/status — check if user has completed onboarding
router.get('/status', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const complete = await OnboardingService.isOnboardingComplete(userId);
    res.json({ onboardingComplete: complete });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get onboarding status' });
  }
});

// GET /api/onboarding/values-cards — return the 5 values pulse cards
router.get('/values-cards', (req, res) => {
  res.json({ cards: OnboardingService.getValuesCards() });
});

// POST /api/onboarding/step/1 — save basic profile
router.post('/step/1', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { name, nickname, role, tagline, photoURL } = req.body;

    if (!name) return res.status(400).json({ error: 'Name is required' });

    await OnboardingService.saveBasicProfile(userId, { name, nickname, role, tagline, photoURL });
    const firstPrompt = await OnboardingService.getFirstConversationPrompt(name);

    res.json({ success: true, step: 1, firstConversationPrompt: firstPrompt });
  } catch (e) {
    console.error('[Onboarding] Step 1 error:', e);
    res.status(500).json({ error: 'Failed to save profile' });
  }
});

// POST /api/onboarding/step/2 — save values answers
router.post('/step/2', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { answers } = req.body; // { work_style: 'A', risk: 'B', ... }

    if (!answers) return res.status(400).json({ error: 'Answers are required' });

    const personalityTags = await OnboardingService.saveValuesAnswers(userId, answers);

    res.json({ success: true, step: 2, personalityTags });
  } catch (e) {
    console.error('[Onboarding] Step 2 error:', e);
    res.status(500).json({ error: 'Failed to save values' });
  }
});

// GET /api/onboarding/first-prompt — companion's opening question
router.get('/first-prompt', verifyAuth, async (req: any, res: any) => {
  try {
    const name = req.query.name as string || 'Friend';
    const prompt = await OnboardingService.getFirstConversationPrompt(name);
    res.json({ prompt });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get first prompt' });
  }
});

// GET /api/onboarding/preview-people — step 4 preview
router.get('/preview-people', async (req, res) => {
  try {
    const people = await OnboardingService.generatePreviewPeople();
    res.json({ people });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get preview people' });
  }
});

// POST /api/onboarding/complete — mark onboarding done
router.post('/complete', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    await OnboardingService.completeOnboarding(userId);
    res.json({ success: true, message: 'Onboarding complete! Welcome to Kudos.' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

export default router;
