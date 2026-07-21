import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kudos-dev-secret-key-2026';

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
  // Fallback to real JWT verify
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    // If not a valid JWT, try Firebase Auth (for any legacy tokens)
    try {
      const decodedFbToken = await auth.verifyIdToken(token);
      (req as any).user = decodedFbToken;
      next();
    } catch (fbError) {
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  }
};
