import { Router } from 'express';
import { db } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();

// Get list of conversations
router.get('/', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const conversationsRef = db.collection('conversations');
    const snapshot = await conversationsRef.where('participants', 'array-contains', user.uid).orderBy('lastMessageAt', 'desc').get();

    const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ conversations });
  } catch (error) {
    console.error('Get Conversations Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get messages for a conversation
router.get('/:id/messages', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const convoDoc = await db.collection('conversations').doc(id).get();
    if (!convoDoc.exists || !convoDoc.data()?.participants.includes(user.uid)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const messagesRef = db.collection('conversations').doc(id).collection('messages');
    const snapshot = await messagesRef.orderBy('createdAt', 'asc').get();

    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json({ messages });
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send a message
router.post('/:id/messages', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { text } = req.body;
    
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!text) return res.status(400).json({ error: 'Message text is required' });

    const convoRef = db.collection('conversations').doc(id);
    const convoDoc = await convoRef.get();
    if (!convoDoc.exists || !convoDoc.data()?.participants.includes(user.uid)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const message = {
      senderId: user.uid,
      text,
      createdAt: FieldValue.serverTimestamp(),
      isRead: false
    };

    const newMsgRef = await convoRef.collection('messages').add(message);
    
    await convoRef.update({
      lastMessage: text,
      lastMessageAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    res.json({ success: true, messageId: newMsgRef.id });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
