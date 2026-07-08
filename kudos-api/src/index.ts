import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './config/firebase';
import './config/groq';
import chatRoutes from './routes/chat.routes';
import billingRoutes from './routes/billing.routes';
import { NudgeService } from './services/ai/nudge.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

import { SSEService } from './services/sse.service';

// Global state to track user interaction for smart nudges
export const AppState = {
  lastInteractionTime: Date.now(),
  lastActiveWindow: ''
};

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  SSEService.addClient(res);
  
  // Send initial connection success
  SSEService.broadcast('connected', 'Connected to Kudos Brain');

  req.on('close', () => {
    SSEService.removeClient(res);
  });
});

// Smart Nudge Logic: Run every 60 seconds, but only nudge if idle for > 5 minutes
setInterval(async () => {
  if (SSEService.getClientCount() > 0) {
    const now = Date.now();
    const idleTimeMinutes = (now - AppState.lastInteractionTime) / (1000 * 60);

    if (idleTimeMinutes > 5) {
      console.log(`[Nudge] User idle for ${Math.round(idleTimeMinutes)} minutes. Generating nudge...`);
      const nudge = await NudgeService.generateProactiveNudge('test_founder_1', AppState.lastActiveWindow);
      SSEService.broadcast('nudge', nudge);
      
      // Reset interaction time so we don't spam nudges every 60s
      AppState.lastInteractionTime = Date.now();
    }
  }
}, 60000);

import { verifyAuth } from './middleware/auth';

// Public Routes (Webhooks)
app.post('/api/billing/webhook', billingRoutes);

// Protected Routes
app.use('/api/chat', verifyAuth, chatRoutes);
app.use('/api/billing', verifyAuth, billingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'kudos-api' });
});

app.listen(PORT, () => {
  console.log(`🚀 Kudos API running on http://localhost:${PORT}`);
});
