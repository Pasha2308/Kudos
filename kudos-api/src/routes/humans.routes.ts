import { Router } from 'express';
import { TrustMatchingService } from '../services/ai/trust-matching.service';
import { verifyAuth } from '../middleware/auth';
import { db, firestoreReady } from '../config/firebase';

const router = Router();

// GET /api/humans/intros — get warm intro suggestions for the current user
router.get('/intros', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const filter = req.query.filter as string | undefined; // 'friends' | 'builders' | 'investors' | 'partners'

    const intros = await TrustMatchingService.findPotentialIntros(userId);

    // Apply filter if provided
    const filtered = filter && filter !== 'all'
      ? intros.filter(intro => {
          if (filter === 'builders') return intro.builderMode;
          return true; // for now other filters just return all
        })
      : intros;

    res.json({ intros: filtered });
  } catch (e) {
    console.error('[Humans] Error fetching intros:', e);
    res.status(500).json({ error: 'Failed to fetch intros' });
  }
});

// GET /api/humans/discover — Get intros and quota info for swipe deck
router.get('/discover', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;
    const intros = await TrustMatchingService.findPotentialIntros(userId);
    
    // Check quota
    let plan = 'free';
    let connectionsThisMonth = 0;
    
    if (firestoreReady) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        plan = data?.plan || 'free';
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        if (data?.lastConnectionMonth === currentMonth) {
          connectionsThisMonth = data?.connectionsThisMonth || 0;
        }
      }
    }
    
    let maxConnections = 5;
    if (plan === 'pro') maxConnections = 15;
    if (plan === 'premium') maxConnections = 25;
    
    res.json({ 
      intros, 
      quota: {
        used: connectionsThisMonth,
        max: maxConnections,
        plan
      }
    });
  } catch (e) {
    console.error('[Humans] Error in discover:', e);
    res.status(500).json({ error: 'Failed to discover humans' });
  }
});

// POST /api/humans/send-note — send a warm note to connect with someone
router.post('/send-note', verifyAuth, async (req: any, res: any) => {
  try {
    const fromUserId = req.user.uid;
    const { toUserId, note } = req.body;

    if (!toUserId || !note) {
      return res.status(400).json({ error: 'toUserId and note are required' });
    }

    // Get sender name and check quota
    let fromUserName = 'Someone on Kudos';
    if (firestoreReady) {
      try {
        const userDoc = await db.collection('users').doc(fromUserId).get();
        if (userDoc.exists) {
          const data = userDoc.data();
          fromUserName = data?.name || fromUserName;
          
          // Quota check
          const plan = data?.plan || 'free';
          let maxConnections = 5;
          if (plan === 'pro') maxConnections = 15;
          if (plan === 'premium') maxConnections = 25;
          
          const currentMonth = new Date().toISOString().slice(0, 7);
          let connectionsThisMonth = 0;
          if (data?.lastConnectionMonth === currentMonth) {
            connectionsThisMonth = data?.connectionsThisMonth || 0;
          }
          
          if (connectionsThisMonth >= maxConnections) {
            return res.status(403).json({ error: 'Quota exceeded for this month' });
          }
          
          // Update quota
          await db.collection('users').doc(fromUserId).set({
            connectionsThisMonth: connectionsThisMonth + 1,
            lastConnectionMonth: currentMonth
          }, { merge: true });
        }
      } catch (e) {
        console.error('Error checking quota:', e);
      }
    }

    const result = await TrustMatchingService.sendWarmNote(fromUserId, toUserId, note);

    res.json({ success: true, introId: result.introId, message: 'Your companion will introduce you.' });
  } catch (e) {
    console.error('[Humans] Error sending note:', e);
    res.status(500).json({ error: 'Failed to send note' });
  }
});

// GET /api/humans/conversations — list human-to-human conversations
router.get('/conversations', verifyAuth, async (req: any, res: any) => {
  try {
    const userId = req.user.uid;

    if (!firestoreReady) {
      return res.json({
        conversations: [
          {
            id: 'conv_priya',
            otherUserId: 'mock_priya',
            otherUserName: 'Priya Sharma',
            otherUserAvatar: null,
            lastMessage: 'That\'s exactly how I feel too.',
            lastMessageAt: new Date(Date.now() - 1800000),
            unreadCount: 0,
            introReason: 'You both mentioned hating small talk.',
          },
        ]
      });
    }

    const convSnap = await db.collection('humanConversations')
      .where('participants', 'array-contains', userId)
      .orderBy('lastMessageAt', 'desc')
      .limit(20)
      .get();

    const conversations = convSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ conversations });
  } catch (e) {
    console.error('[Humans] Error fetching conversations:', e);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET /api/humans/messages/:conversationId — get messages in a human conversation
router.get('/messages/:conversationId', verifyAuth, async (req: any, res: any) => {
  try {
    const { conversationId } = req.params;

    if (!firestoreReady) {
      return res.json({
        messages: [
          {
            id: 'msg_1',
            role: 'intro',
            content: 'Your companion introduced you because: You both mentioned hating small talk. Priya also stays up late building things.',
            timestamp: new Date(Date.now() - 86400000),
          },
          {
            id: 'msg_2',
            role: 'other',
            senderName: 'Priya',
            content: 'Hey! Your companion said you build at night too 😄',
            timestamp: new Date(Date.now() - 3600000),
          },
        ]
      });
    }

    const snap = await db.collection('humanConversations')
      .doc(conversationId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .limit(50)
      .get();

    const messages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ messages });
  } catch (e) {
    console.error('[Humans] Error fetching messages:', e);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/humans/messages/:conversationId — send a message in a human conversation
router.post('/messages/:conversationId', verifyAuth, async (req: any, res: any) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.uid;
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    const messageId = `msg_${Date.now()}`;

    if (firestoreReady) {
      await db.collection('humanConversations')
        .doc(conversationId)
        .collection('messages')
        .doc(messageId)
        .set({
          senderId: userId,
          content,
          role: 'user',
          timestamp: new Date(),
        });

      await db.collection('humanConversations')
        .doc(conversationId)
        .set({
          lastMessage: content,
          lastMessageAt: new Date(),
        }, { merge: true });
    }

    res.json({ success: true, messageId });
  } catch (e) {
    console.error('[Humans] Error sending message:', e);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;
