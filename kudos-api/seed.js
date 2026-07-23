const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:8080/api';

async function seed() {
  console.log('🌱 Seeding test accounts...');

  try {
    // 1. Create a FRESH account
    const freshRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Fresh User', email: 'fresh@test.com', password: 'password123' })
    });
    const freshData = await freshRes.json();
    if (freshRes.ok) {
      console.log('✅ Created fresh account: fresh@test.com / password123');
    } else {
      console.log('ℹ️ Fresh account issue (may already exist):', freshData);
    }

    // 2. Create an ESTABLISHED account
    const estRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Pro Builder', email: 'pro@test.com', password: 'password123' })
    });
    const estData = await estRes.json();
    
    if (estRes.ok && estData.token) {
      console.log('✅ Created pro account: pro@test.com / password123');
      
      // Update profile for established account
      const profRes = await fetch(`${API_URL}/onboarding/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${estData.token}`
        },
        body: JSON.stringify({ 
          builderType: 'Operator',
          coreNeed: 'Accountability',
          openness: 'Open book',
          onboardingCompleted: true
        })
      });
      if (profRes.ok) {
         console.log('✅ Set up pro account profile data.');
      } else {
         console.log('❌ Failed to setup pro account profile.', await profRes.text());
      }
    } else {
      console.log('ℹ️ Pro account issue (may already exist):', estData);
    }
  } catch (err) {
    console.error('❌ Error during seeding:', err);
  }
}

seed();
