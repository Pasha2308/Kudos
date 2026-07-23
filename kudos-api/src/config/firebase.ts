import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const serviceAccountPath = path.resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-adminsdk.json');
const localDbPath = path.resolve(process.cwd(), './local-db.json');

let app;
export let firestoreReady = false;

try {
  if (fs.existsSync(serviceAccountPath)) {
    app = initializeApp({
      credential: cert(serviceAccountPath),
    });
    console.log('✅ Firebase Admin SDK initialized');
  } else {
    console.warn('⚠️ Firebase credentials not found, using Mock DB for all operations.');
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock DB Layer for Local Dev
// ─────────────────────────────────────────────────────────────────────────────
class MockDoc {
  constructor(public collectionName: string, public docId: string) {}
  
  private readDb() {
    if (!fs.existsSync(localDbPath)) return {};
    return JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
  }
  
  private writeDb(data: any) {
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
  }

  async get() {
    const db = this.readDb();
    const data = db[this.collectionName]?.[this.docId];
    return {
      exists: !!data,
      data: () => data,
    };
  }

  async set(data: any, options?: { merge: boolean }) {
    const db = this.readDb();
    if (!db[this.collectionName]) db[this.collectionName] = {};
    if (options?.merge) {
      db[this.collectionName][this.docId] = { ...db[this.collectionName][this.docId], ...data };
    } else {
      db[this.collectionName][this.docId] = data;
    }
    this.writeDb(db);
  }

  collection(name: string) {
    return new MockCollection(`${this.collectionName}_${this.docId}_${name}`);
  }
}

class MockCollection {
  private filters: any[] = [];
  private limitCount: number = 20;

  constructor(public name: string) {}

  doc(id: string) { return new MockDoc(this.name, id); }

  where(field: string, op: string, val: any) {
    this.filters.push({ field, op, val });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async get() {
    const localDbPath = path.resolve(process.cwd(), './local-db.json');
    let db: any = {};
    if (fs.existsSync(localDbPath)) {
      db = JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
    }
    const col = db[this.name] || {};
    let docs = Object.keys(col).map(id => ({
      id,
      data: () => col[id]
    }));

    for (const f of this.filters) {
      if (f.op === '==') {
        docs = docs.filter(d => d.data()[f.field] === f.val);
      }
    }

    docs = docs.slice(0, this.limitCount);

    return { empty: docs.length === 0, docs };
  }
}

const mockDb = {
  collection: (name: string) => new MockCollection(name),
  batch: () => ({ set: () => {}, update: () => {}, delete: () => {}, commit: async () => {} })
};

// ─────────────────────────────────────────────────────────────────────────────

export let db: any;
export let auth: any;

if (app) {
  db = getFirestore();
  auth = getAuth();
} else {
  db = mockDb;
  auth = {}; // Mock auth if needed
}

// Verify Firestore connectivity on startup
(async () => {
  if (!app) return;
  try {
    await getFirestore().collection('_health').limit(1).get();
    firestoreReady = true;
    console.log('✅ Firestore connected and ready');
  } catch (err: any) {
    if (err.code === 5 || err.code === 16) {
      console.warn('⚠️  Firestore NOT_FOUND or UNAUTHENTICATED. Switching to Local Mock DB.');
      db = mockDb; // Fallback to mock if real connection fails
    } else {
      console.warn('⚠️  Firestore connectivity check failed:', err.message);
    }
  }
})();
