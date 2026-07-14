import express, { Router } from 'express';
import Stripe from 'stripe';
import { verifyAuth } from '../middleware/auth';
import { db } from '../config/firebase';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia' as any
});

// Create a checkout session for subscription
router.post('/create-checkout-session', verifyAuth, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const { planId } = req.body;
    
    // Hardcoded plan for now, later mapped from DB
    const priceId = planId === 'premium' ? 'price_premium_mock' : 'price_basic_mock';

    let sessionUrl = `http://localhost:3000/dashboard?success=true&session_id=mock_session_123`;
    
    try {
      if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_mock') {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'subscription',
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: `http://localhost:3000/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `http://localhost:3000/dashboard?canceled=true`,
          client_reference_id: userId,
        });
        if (session.url) sessionUrl = session.url;
      }
    } catch (stripeErr) {
      console.warn('Stripe not fully configured, falling back to mock checkout URL.');
    }

    res.json({ url: sessionUrl });
  } catch (error: any) {
    console.error('Stripe Error:', error);
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
