import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import './config/firebase';
import './config/groq';
import chatRoutes from './routes/chat.routes';
import billingRoutes from './routes/billing.routes';
import kycRoutes from './routes/kyc.routes';
import matchmakingRoutes from './routes/matchmaking.routes';
import authRoutes from './routes/auth.routes';
import memoryRoutes from './routes/memory.routes';
import userRoutes from './routes/user.routes';
import onboardingRoutes from './routes/onboarding.routes';
import humansRoutes from './routes/humans.routes';
import roomsRoutes from './routes/rooms.routes';
import kudosRoutes from './routes/kudos.routes';
import connectionHealthRoutes from './routes/connection-health.routes';
import builderRoutes from './routes/builder.routes';
import settingsRoutes from './routes/settings.routes';
import notificationRoutes from './routes/notification.routes';
import dmRoutes from './routes/dm.routes';
import searchRoutes from './routes/search.routes';
import profileRoutes from './routes/profile.routes';
import { NudgeService } from './services/ai/nudge.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json());

import { SSEService } from './services/sse.service';

// Global state to track user interaction for smart nudges
export const AppState = {
  lastInteractionTime: Date.now(),
  lastActiveWindow: '',
  localMode: false
};

// --- Simple SSE Endpoint ---
app.get('/api/stream', async (req, res) => {
  const token = req.query.token as string;
  let userId = 'anonymous';

  if (token) {
    if (process.env.NODE_ENV !== 'production' && token.startsWith('mock_token')) {
      userId = token.replace('mock_token', '').replace('_', '') || 'test_founder_1';
    } else {
      try {
        const { auth } = require('./config/firebase');
        const decodedToken = await auth.verifyIdToken(token);
        userId = decodedToken.uid;
      } catch (e) {
        console.warn('SSE token invalid:', e);
      }
    }
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  SSEService.addClient(userId, res);
  
  // Send initial connection success
  SSEService.emitToUser(userId, 'connected', 'Connected to Kudos Brain');

  req.on('close', () => {
    SSEService.removeClient(userId, res);
  });
});

// Smart Nudge Logic: Run every 60 seconds, but only nudge if idle for > 5 minutes
setInterval(async () => {
  if (SSEService.getClientCount() > 0) {
    const now = Date.now();
    const idleTimeMinutes = (now - AppState.lastInteractionTime) / (1000 * 60);

    if (idleTimeMinutes > 5) {
      console.log(`[Nudge] User idle for ${Math.round(idleTimeMinutes)} minutes. Generating nudge...`);
      const nudge = await NudgeService.generateProactiveNudge('test_founder_1', AppState.lastActiveWindow, AppState.localMode);
      SSEService.broadcast('nudge', nudge);
      
      // Also send FCM push notification to mobile
      try {
        const { db } = await import('./config/firebase');
        const userDoc = await db.collection('users').doc('test_founder_1').get();
        if (userDoc.exists) {
          const fcmToken = userDoc.data()?.fcmToken;
          if (fcmToken) {
            const { getMessaging } = await import('firebase-admin/messaging');
            await getMessaging().send({
              token: fcmToken,
              notification: {
                title: 'Kudos',
                body: nudge
              },
              data: { type: 'nudge' }
            });
            console.log(`[FCM] Push notification sent to mobile device.`);
          }
        }
      } catch (e: any) {
        console.warn(`[FCM] Push failed: ${e.message}`);
      }

      // Reset interaction time so we don't spam nudges every 60s
      AppState.lastInteractionTime = Date.now();
    }
  }
}, 60000);

import { verifyAuth } from './middleware/auth';

// Public Routes (Webhooks)
app.post('/api/billing/webhook', billingRoutes);

// Protected Routes
app.use('/api/auth', authRoutes);
app.use('/api/memory', verifyAuth, memoryRoutes);
app.use('/api/chat', verifyAuth, chatRoutes);
app.use('/api/billing', verifyAuth, billingRoutes);
app.use('/api/kyc', verifyAuth, kycRoutes);
app.use('/api/matchmaking', verifyAuth, matchmakingRoutes);
app.use('/api/user', verifyAuth, userRoutes);

// New Kudos Routes
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/humans', verifyAuth, humansRoutes);
app.use('/api/rooms', verifyAuth, roomsRoutes);
app.use('/api/kudos', verifyAuth, kudosRoutes);
app.use('/api/health', verifyAuth, connectionHealthRoutes);
app.use('/api/builder', verifyAuth, builderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dm', dmRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/profile', profileRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'kudos-api' });
});

app.listen(PORT, () => {
  console.log(`🚀 Kudos API running on http://localhost:${PORT}`);
});
