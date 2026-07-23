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

export const callGroqWithFallback = async (
  messages: any[],
  models: string[],
  options: { temperature?: number, max_tokens?: number, response_format?: any } = {}
) => {
  const client = getGroqClient();
  let lastError: any;

  for (const model of models) {
    try {
      console.log(`[Groq] Attempting request with model: ${model}`);
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens ?? 500,
        response_format: options.response_format,
      });
      return response.choices[0]?.message?.content?.trim() || '';
    } catch (err: any) {
      console.warn(`[Groq] Model ${model} failed:`, err.message || err);
      lastError = err;
      // Continue to next model in the fallback array
    }
  }

  console.error('[Groq] All fallback models failed.');
  throw lastError;
};

export default groq;
