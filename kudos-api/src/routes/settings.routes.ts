import { Router } from 'express';
import { db } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';

const router = Router();

// Endpoint: GET /api/settings
router.get('/', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const doc = await db.collection('users').doc(user.uid).collection('settings').doc('preferences').get();
    
    // Default settings if not exist
    const defaultSettings = {
      theme: 'system',
      chatDensity: 'comfortable',
      fontSize: 'medium',
      accentColor: 'indigo',
      emailNotifications: true,
      pushNotifications: false,
      quietHours: false,
      privacySearchable: true,
      privacyOnlineStatus: true,
      lastUpdated: new Date()
    };

    if (!doc.exists) {
      return res.json({ settings: defaultSettings });
    }

    res.json({ settings: { ...defaultSettings, ...doc.data() } });
  } catch (error) {
    console.error('Get Settings Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: PUT /api/settings
router.put('/', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ error: 'Settings object required' });
    }

    const settingsRef = db.collection('users').doc(user.uid).collection('settings').doc('preferences');
    
    await settingsRef.set({
      ...settings,
      lastUpdated: new Date()
    }, { merge: true });

    // Notify connected clients (desktop/mobile) about the change
    const { SSEService } = require('../services/sse.service');
    SSEService.getInstance().broadcastToUser(user.uid, {
      type: 'preferences-updated',
      preferences: settings
    });

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: DELETE /api/settings/account
router.delete('/account', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // Soft delete or anonymize
    await db.collection('users').doc(user.uid).update({
      deleted: true,
      deletedAt: new Date()
    });

    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
