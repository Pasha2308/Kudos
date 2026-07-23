import { Request, Response, NextFunction } from 'express';
import { db, firestoreReady } from '../config/firebase';

/**
 * Admin middleware — checks that the authenticated user has role='admin' in Firestore.
 * Must be used AFTER verifyAuth middleware.
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // In dev mode, allow a special admin mock token
    if (process.env.NODE_ENV !== 'production' && userId === 'admin_user') {
      return next();
    }

    if (!firestoreReady) {
      // Local dev fallback: allow if userId contains 'admin'
      if (userId.includes('admin')) return next();
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(403).json({ error: 'Forbidden: User not found' });
    }

    const userData = userDoc.data();
    if (userData?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    next();
  } catch (e) {
    console.error('[Admin Middleware] Error:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
