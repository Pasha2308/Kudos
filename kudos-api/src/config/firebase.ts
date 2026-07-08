import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-adminsdk.json');

let app;
export let firestoreReady = false;

try {
  app = initializeApp({
    credential: cert(serviceAccountPath),
  });
  console.log('✅ Firebase Admin SDK initialized');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

export const db = getFirestore();
export const auth = getAuth();

// Verify Firestore connectivity on startup
(async () => {
  try {
    // A lightweight read to verify the database exists
    await db.collection('_health').limit(1).get();
    firestoreReady = true;
    console.log('✅ Firestore connected and ready');
  } catch (err: any) {
    if (err.code === 5) {
      console.error('❌ Firestore NOT_FOUND — The Firestore database likely does not exist yet.');
      console.error('   → Go to https://console.firebase.google.com/project/kudos-ai-backend/firestore and create the database.');
      console.error('   → The API will still work, but no data will be persisted.');
    } else {
      console.error('❌ Firestore connectivity check failed:', err.message);
    }
  }
})();

