import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  // For local dev without a real firebase token, we can mock it 
  if (process.env.NODE_ENV !== 'production' && token === 'mock_token') {
    (req as any).user = { uid: 'test_founder_1' };
    return next();
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
