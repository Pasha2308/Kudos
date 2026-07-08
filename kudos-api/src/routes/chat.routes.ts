import { Router } from 'express';
import { ConversationService } from '../services/ai/conversation.service';
import { AppState } from '../index';

const router = Router();

// Endpoint: POST /api/chat/send
router.post('/send', async (req, res) => {
  try {
    const { message, userId = 'test_founder_1', mode = 'partner', activeWindow = '' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Reset idle timer
    AppState.lastInteractionTime = Date.now();

    // Pass to AI service
    const reply = await ConversationService.sendMessage(userId, message, mode, activeWindow);

    res.json({ reply });
  } catch (error) {
    console.error('Chat Route Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: POST /api/chat/sync
router.post('/sync', (req, res) => {
  const { activeWindow, isIdle } = req.body;
  if (activeWindow !== undefined) {
    AppState.lastActiveWindow = activeWindow;
  }
  if (!isIdle) {
    AppState.lastInteractionTime = Date.now();
  }
  res.json({ success: true });
});

export default router;
