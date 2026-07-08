import { Router } from 'express';
import Stripe from 'stripe';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
  apiVersion: '2025-01-27.acacia' as any
});

// Create a checkout session for subscription
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId, planId } = req.body;
    
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

// Stripe Webhook
router.post('/webhook', (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  // Webhook handling logic would verify signature here using raw body
  // For now, we mock the success
  
  console.log('Received Stripe Webhook');
  res.json({ received: true });
});

export default router;
