import express, { Router } from 'express';
import Stripe from 'stripe';
import { verifyAuth } from '../middleware/auth';
import { db } from '../config/firebase';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia' as any
});

// Create a checkout session for subscription (Mocked for Phase 1 - Everything is Free)
router.post('/create-checkout-session', verifyAuth, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const { planId } = req.body;
    
    // For Phase 1, just instantly upgrade the user for free
    if (planId === 'pro' || planId === 'premium') {
      await db.collection('users').doc(userId).set({
        plan: planId,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    res.json({ url: `http://localhost:3000/dashboard?success=true&plan=${planId}` });
  } catch (error: any) {
    console.error('Billing Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe Webhook (Do not use verifyAuth here, it's called by Stripe)
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock';

  let event;
  
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_mock') {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Mock event for local dev without real Stripe
    event = req.body;
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;

    if (userId) {
      console.log(`Upgrading user ${userId} to Pro plan.`);
      try {
        await db.collection('users').doc(userId).set({
          plan: 'pro',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Failed to update user plan in Firestore', err);
      }
    }
  }

  res.json({ received: true });
});

export default router;
