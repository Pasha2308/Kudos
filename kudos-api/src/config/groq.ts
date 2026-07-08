import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn('⚠️  GROQ_API_KEY is not set in environment variables.');
}

const groq = new Groq({ apiKey });

export const getGroqClient = () => {
  if (!groq) {
    throw new Error('Groq client is not initialized.');
  }
  return groq;
};

export default groq;
