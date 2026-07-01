import { Router } from 'express';
import { ConversationService } from '../services/ai/conversation.service';

const router = Router();

// Endpoint: POST /api/chat/send
router.post('/send', async (req, res) => {
  try {
    const { message, userId = 'anonymous_founder' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Pass to AI service
    const reply = await ConversationService.sendMessage(userId, message);

    res.json({ reply });
  } catch (error) {
    console.error('Chat Route Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
