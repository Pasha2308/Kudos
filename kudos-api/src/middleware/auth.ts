import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split('Bearer ')[1];
  
  // Enforce real tokens in production. In development, allow mock_token until Firebase Web is configured.
  if (process.env.NODE_ENV !== 'production' && token.startsWith('mock_token')) {
    const uid = token.replace('mock_token', '').replace('_', '') || 'test_founder_1';
    (req as any).user = { uid: uid, email: `${uid}@example.com` };
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
