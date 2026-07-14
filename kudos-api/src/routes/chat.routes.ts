import { Router } from 'express';
import { ConversationService } from '../services/ai/conversation.service';
import { AppState } from '../index';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// Endpoint: POST /api/chat/send
router.post('/send', verifyAuth, async (req, res) => {
  try {
    const { message, mode = 'partner', activeWindow = '', localMode = false } = req.body;
    const userId = (req as any).user.uid;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Reset idle timer
    AppState.lastInteractionTime = Date.now();

    // Pass to AI service
    const reply = await ConversationService.sendMessage(userId, message, mode, activeWindow, localMode);

    res.json({ reply });
  } catch (error) {
    console.error('Chat Route Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: GET /api/chat/history
router.get('/history', verifyAuth, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const history = await ConversationService.getHistory(userId);
    res.json({ history });
  } catch (error) {
    console.error('Chat History Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: POST /api/chat/sync
router.post('/sync', (req, res) => {
  const { activeWindow, isIdle, localMode } = req.body;
  if (activeWindow !== undefined) {
    AppState.lastActiveWindow = activeWindow;
  }
  if (localMode !== undefined) {
    AppState.localMode = localMode;
  }
  if (!isIdle) {
    AppState.lastInteractionTime = Date.now();
  }
  res.json({ success: true });
});

export default router;
