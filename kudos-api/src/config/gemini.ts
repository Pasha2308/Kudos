import { VertexAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_LOCATION || 'us-central1';

if (!projectId) {
  console.warn('⚠️  GCP_PROJECT_ID is not set in environment variables.');
}

// Ensure Vertex AI runs using Application Default Credentials.
// Since we have Firebase Admin, we can point to the same service account if needed,
// but the @google/genai SDK automatically picks up GOOGLE_APPLICATION_CREDENTIALS.
// Let's set it manually in the code so it uses our specific firebase JSON file if available.
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
}

let ai: VertexAI | null = null;

try {
  ai = new VertexAI({
    project: projectId as string,
    location: location,
  });
  console.log(`✅ Vertex AI initialized for project ${projectId} in ${location}`);
} catch (error) {
  console.error('❌ Vertex AI initialization error:', error);
}

export const getGeminiModel = (modelName = 'gemini-2.0-flash-exp') => {
  if (!ai) {
    throw new Error('Vertex AI client is not initialized.');
  }
  return ai.getGenerativeModel({ model: modelName });
};

export default ai;
