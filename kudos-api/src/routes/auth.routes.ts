import { Router } from 'express';
import { db } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'kudos-dev-secret-key-2026';

// Endpoint: POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use a clean string for uid if no password was provided (legacy/mock logic fallback)
    const uid = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const userRef = db.collection('users').doc(uid);
    
    const doc = await userRef.get();
    if (doc.exists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = {
      uid,
      email,
      name: name || email.split('@')[0],
      passwordHash,
      createdAt: new Date(),
      subscriptionTier: 'free'
    };

    await userRef.set(newUser);

    const token = jwt.sign({ uid, email, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: 'User registered', token, user: { uid, email, name: newUser.name } });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const uid = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userData = doc.data();
    if (!userData || !userData.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials (no password set)' });
    }

    const match = await bcrypt.compare(password, userData.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ uid, email, name: userData.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ message: 'Login successful', token, user: { uid, email, name: userData.name } });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: GET /api/auth/me
router.get('/me', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    
    const doc = await db.collection('users').doc(user.uid).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    
    const data = doc.data() || {};
    // Dont send back password hash
    delete data.passwordHash;
    
    res.json({ user: data });
  } catch (error) {
    console.error('Me Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint: POST /api/auth/fcm-token
router.post('/fcm-token', verifyAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { fcmToken } = req.body;
    if (fcmToken) {
      await db.collection('users').doc(user.uid).update({ fcmToken });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('FCM Token Save Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
