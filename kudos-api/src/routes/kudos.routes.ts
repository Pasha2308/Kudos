import { Router } from 'express';
import { KudosService } from '../services/kudos.service';
import { verifyAuth } from '../middleware/auth';
import { db, firestoreReady } from '../config/firebase';

const router = Router();

// GET /api/kudos/received — get kudos received by current user
router.get('/received', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const kudos = await KudosService.getReceivedKudos(userId);
    res.json({ kudos });
  } catch (e) {
    console.error('[Kudos] Error:', e);
    res.status(500).json({ error: 'Failed to fetch kudos' });
  }
});

// GET /api/kudos/sent — get kudos sent by current user
router.get('/sent', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const kudos = await KudosService.getSentKudos(userId);
    res.json({ kudos });
  } catch (e) {
    console.error('[Kudos] Error:', e);
    res.status(500).json({ error: 'Failed to fetch sent kudos' });
  }
});

// GET /api/kudos/weekly-stats — get weekly reflection stats
router.get('/weekly-stats', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const stats = await KudosService.getWeeklyStats(userId);
    res.json({ stats });
  } catch (e) {
    console.error('[Kudos] Weekly stats error:', e);
    res.status(500).json({ error: 'Failed to fetch weekly stats' });
  }
});

// POST /api/kudos/send — send a kudos to another user
router.post('/send', verifyAuth, async (req: any, res: any) => {
  try {
    const fromUserId = req.user.uid;
    const { toUserId, triggeredByMessage } = req.body;

    if (!toUserId) {
      return res.status(400).json({ error: 'toUserId is required' });
    }

    // Get sender name
    let fromUserName = 'Someone';
    let toUserName = 'Someone';
    if (firestoreReady) {
      try {
        const [fromDoc, toDoc] = await Promise.all([
          db.collection('users').doc(fromUserId).get(),
          db.collection('users').doc(toUserId).get(),
        ]);
        fromUserName = fromDoc.data()?.name || fromUserName;
        toUserName = toDoc.data()?.name || toUserName;
      } catch (_) {}
    }

    const result = await KudosService.sendKudos(
      fromUserId,
      fromUserName,
      toUserId,
      toUserName,
      triggeredByMessage || ''
    );

    res.json({ success: true, kudosId: result.kudosId });
  } catch (e) {
    console.error('[Kudos] Send error:', e);
    res.status(500).json({ error: 'Failed to send kudos' });
  }
});

// POST /api/kudos/:kudosId/read — mark a kudos as read
router.post('/:kudosId/read', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { kudosId } = req.params;
    await KudosService.markRead(kudosId, userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to mark read' });
  }
});

export default router;
