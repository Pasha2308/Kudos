import { Router } from 'express';
import { RoomsService } from '../services/rooms.service';
import { verifyAuth } from '../middleware/auth';
import { db, firestoreReady } from '../config/firebase';

const router = Router();

// GET /api/rooms — get all rooms (user's + suggested)
router.get('/', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { userRooms, suggestedRooms } = await RoomsService.getRooms(userId);

    // Enrich rooms with days remaining
    const enrichRoom = (room: any) => ({
      ...room,
      daysRemaining: RoomsService.getDaysRemaining(room.closesAt),
    });

    res.json({
      userRooms: userRooms.map(enrichRoom),
      suggestedRooms: suggestedRooms.map(enrichRoom),
    });
  } catch (e) {
    console.error('[Rooms] Error fetching rooms:', e);
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// POST /api/rooms — create a new room
router.post('/', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { name, emoji, description, tags } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const room = await RoomsService.createRoom(userId, { name, emoji, description, tags });
    const daysRemaining = RoomsService.getDaysRemaining(room.closesAt);

    res.json({ success: true, room: { ...room, daysRemaining } });
  } catch (e) {
    console.error('[Rooms] Error creating room:', e);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// POST /api/rooms/:roomId/join — join a room
router.post('/:roomId/join', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { roomId } = req.params;

    const result = await RoomsService.joinRoom(userId, roomId);
    res.json(result);
  } catch (e) {
    console.error('[Rooms] Error joining room:', e);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// GET /api/rooms/:roomId/messages — get room chat messages
router.get('/:roomId/messages', verifyAuth, async (req: any, res: any) => {
  try {
    const { roomId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await RoomsService.getRoomMessages(roomId, limit);
    res.json({ messages });
  } catch (e) {
    console.error('[Rooms] Error fetching messages:', e);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/rooms/:roomId/messages — send a message in a room
router.post('/:roomId/messages', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const { roomId } = req.params;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    // Get user's name
    let userName = 'Someone';
    if (firestoreReady) {
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        userName = userDoc.data()?.name || userName;
      } catch (_) {}
    }

    const result = await RoomsService.sendRoomMessage(roomId, userId, userName, content);
    res.json(result);
  } catch (e) {
    console.error('[Rooms] Error sending message:', e);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
