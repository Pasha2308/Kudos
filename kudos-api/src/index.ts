import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './config/firebase';
import './config/gemini';

dotenv.config();

import chatRoutes from './routes/chat.routes';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'kudos-api' });
});

app.listen(PORT, () => {
  console.log(`🚀 Kudos API running on http://localhost:${PORT}`);
});
