import { Router } from 'express';
import { db } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// Get unread notifications
router.get('/', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const notificationsRef = db.collection('users').doc(user.uid).collection('notifications');
    const snapshot = await notificationsRef.orderBy('createdAt', 'desc').limit(20).get();

    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json({ notifications });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/:id/read', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    await db.collection('users').doc(user.uid).collection('notifications').doc(id).update({
      isRead: true,
      readAt: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all as read
router.put('/read-all', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const notificationsRef = db.collection('users').doc(user.uid).collection('notifications');
    const unread = await notificationsRef.where('isRead', '==', false).get();

    const batch = db.batch();
    unread.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true, readAt: new Date() });
    });

    await batch.commit();

    res.json({ success: true, count: unread.size });
  } catch (error) {
    console.error('Mark All Read Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
