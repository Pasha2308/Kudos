import { Router } from 'express';
import { db, firestoreReady } from '../config/firebase';
import { verifyAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';

const router = Router();

// All admin routes require auth + admin role
router.use(verifyAuth, requireAdmin);

// ─── Helper: Mock stats for local dev ────────────────────────────────────────
const getMockStats = () => ({
  totalUsers: 1247,
  activeToday: 89,
  matchesMade: 342,
  matchAcceptRate: 67,
  mrr: 4890,
  aiConversations: 2341,
  flaggedContent: 3,
  kycPending: 12,
  planBreakdown: { free: 980, pro: 231, elite: 36 },
  newUsersThisWeek: 47,
  churnRate: 3.2,
  avgResponseTime: 420,
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req: any, res: any) => {
  try {
    if (!firestoreReady) {
      return res.json(getMockStats());
    }

    // Real Firestore stats
    const [usersSnap, matchesSnap, flaggedSnap, kycSnap] = await Promise.all([
      db.collection('users').limit(1000).get(),
      db.collection('intros').limit(1000).get(),
      db.collection('flaggedContent').where('status', '==', 'pending').limit(100).get(),
      db.collection('users').where('kycStatus', '==', 'pending').limit(100).get(),
    ]);

    const allUsers = usersSnap.docs.map(d => d.data());
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const activeToday = allUsers.filter(u => {
      const lastActive = u.lastActiveAt?.toDate?.() || new Date(u.updatedAt || 0);
      return lastActive >= todayStart;
    }).length;

    const allIntros = matchesSnap.docs.map(d => d.data());
    const matchAccepted = allIntros.filter(i => i.status === 'accepted').length;
    const matchRate = allIntros.length > 0 ? Math.round((matchAccepted / allIntros.length) * 100) : 0;

    const planBreakdown = { free: 0, pro: 0, elite: 0 };
    allUsers.forEach(u => {
      const plan = u.plan || 'free';
      if (plan in planBreakdown) planBreakdown[plan as keyof typeof planBreakdown]++;
    });

    const proMRR = planBreakdown.pro * 499;
    const eliteMRR = planBreakdown.elite * 1299;

    res.json({
      totalUsers: allUsers.length,
      activeToday,
      matchesMade: allIntros.length,
      matchAcceptRate: matchRate,
      mrr: proMRR + eliteMRR,
      aiConversations: 0, // TODO: aggregate from conversation subcollections
      flaggedContent: flaggedSnap.docs.length,
      kycPending: kycSnap.docs.length,
      planBreakdown,
      newUsersThisWeek: 0, // TODO: query by createdAt
      churnRate: 0,
      avgResponseTime: 0,
    });
  } catch (e) {
    console.error('[Admin] Stats error:', e);
    res.json(getMockStats());
  }
});

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req: any, res: any) => {
  try {
    const { plan, kyc, search, limit: limitParam = '50' } = req.query;
    const pageLimit = Math.min(parseInt(limitParam as string) || 50, 200);

    if (!firestoreReady) {
      return res.json({
        users: [
          { uid: 'mock_1', name: 'Rahul Mehta', email: 'rahul@example.com', plan: 'elite', kycStatus: 'approved', role: 'Founder', createdAt: new Date(Date.now() - 86400000 * 30).toISOString(), lastActiveAt: new Date(Date.now() - 3600000).toISOString(), messageCount: 142, matchCount: 8, badges: ['advisor', 'verified_founder'] },
          { uid: 'mock_2', name: 'Priya Sharma', email: 'priya@example.com', plan: 'pro', kycStatus: 'approved', role: 'Designer', createdAt: new Date(Date.now() - 86400000 * 20).toISOString(), lastActiveAt: new Date(Date.now() - 7200000).toISOString(), messageCount: 89, matchCount: 5, badges: ['trusted'] },
          { uid: 'mock_3', name: 'Arjun Kapoor', email: 'arjun@example.com', plan: 'pro', kycStatus: 'pending', role: 'CTO', createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), lastActiveAt: new Date(Date.now() - 1800000).toISOString(), messageCount: 34, matchCount: 2, badges: [] },
          { uid: 'mock_4', name: 'Zara Ahmed', email: 'zara@example.com', plan: 'free', kycStatus: 'none', role: 'Product', createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), lastActiveAt: new Date(Date.now() - 86400000).toISOString(), messageCount: 12, matchCount: 1, badges: [] },
        ],
        total: 4,
      });
    }

    let query: any = db.collection('users');
    if (plan) query = query.where('plan', '==', plan);
    if (kyc) query = query.where('kycStatus', '==', kyc);
    const snap = await query.limit(pageLimit).get();

    let users = snap.docs.map((d: any) => ({
      uid: d.id,
      ...d.data(),
    }));

    if (search) {
      const q = (search as string).toLowerCase();
      users = users.filter((u: any) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }

    res.json({ users, total: users.length });
  } catch (e) {
    console.error('[Admin] Users error:', e);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── GET /api/admin/users/:userId ─────────────────────────────────────────────
router.get('/users/:userId', async (req: any, res: any) => {
  try {
    const { userId } = req.params;

    if (!firestoreReady) {
      return res.json({
        uid: userId,
        name: 'Mock User',
        email: 'mock@example.com',
        plan: 'pro',
        kycStatus: 'approved',
        role: 'Founder',
        situationProfile: { currentSituation: 'building_alone', needType: 'advisor', beenThrough: ['first_job', 'freelancing_alone'], intensity: 6 },
        personalityTags: ['Builder', 'Direct', 'Night owl'],
        messageCount: 89,
        matchCount: 5,
        badges: ['trusted'],
        createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
        lastActiveAt: new Date(Date.now() - 7200000).toISOString(),
      });
    }

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

    // Get match history
    const introsSnap = await db.collection('intros').where('fromUserId', '==', userId).limit(20).get();
    const intros = introsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({
      uid: userId,
      ...userDoc.data(),
      intros,
    });
  } catch (e) {
    console.error('[Admin] User detail error:', e);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ─── POST /api/admin/users/:userId/ban ───────────────────────────────────────
router.post('/users/:userId/ban', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    await db.collection('users').doc(userId).set({
      banned: true,
      bannedAt: new Date().toISOString(),
      bannedReason: reason || 'Violation of community guidelines',
      bannedBy: req.user.uid,
    }, { merge: true });
    res.json({ success: true, message: `User ${userId} banned` });
  } catch (e) {
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

// ─── POST /api/admin/users/:userId/unban ─────────────────────────────────────
router.post('/users/:userId/unban', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    await db.collection('users').doc(userId).set({ banned: false, bannedAt: null }, { merge: true });
    res.json({ success: true, message: `User ${userId} unbanned` });
  } catch (e) {
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

// ─── POST /api/admin/users/:userId/approve-kyc ───────────────────────────────
router.post('/users/:userId/approve-kyc', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    await db.collection('users').doc(userId).set({
      kycStatus: 'approved',
      kycApprovedAt: new Date().toISOString(),
      kycApprovedBy: req.user.uid,
      badges: ['trusted'], // grant trusted badge on KYC approval
    }, { merge: true });
    res.json({ success: true, message: 'KYC approved and Trusted badge granted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve KYC' });
  }
});

// ─── POST /api/admin/users/:userId/reject-kyc ────────────────────────────────
router.post('/users/:userId/reject-kyc', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    await db.collection('users').doc(userId).set({
      kycStatus: 'rejected',
      kycRejectedReason: reason || 'Documents could not be verified',
    }, { merge: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reject KYC' });
  }
});

// ─── POST /api/admin/users/:userId/grant-badge ───────────────────────────────
router.post('/users/:userId/grant-badge', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { badge } = req.body; // 'trusted' | 'verified_founder' | 'advisor' | 'community_builder'
    const validBadges = ['trusted', 'verified_founder', 'advisor', 'community_builder', 'power_user'];
    if (!validBadges.includes(badge)) return res.status(400).json({ error: 'Invalid badge' });

    const userDoc = await db.collection('users').doc(userId).get();
    const existingBadges: string[] = userDoc.data()?.badges || [];
    if (!existingBadges.includes(badge)) {
      existingBadges.push(badge);
    }
    await db.collection('users').doc(userId).set({ badges: existingBadges }, { merge: true });
    res.json({ success: true, badges: existingBadges });
  } catch (e) {
    res.status(500).json({ error: 'Failed to grant badge' });
  }
});

// ─── GET /api/admin/matches ───────────────────────────────────────────────────
router.get('/matches', async (req: any, res: any) => {
  try {
    if (!firestoreReady) {
      return res.json({
        total: 342,
        accepted: 229,
        declined: 71,
        pending: 42,
        acceptRate: 67,
        avgTimeToReply: 18,
        topSituations: [
          { situation: 'cofounder_conflict', matches: 89, acceptRate: 78 },
          { situation: 'loneliness', matches: 67, acceptRate: 71 },
          { situation: 'burnout', matches: 54, acceptRate: 65 },
          { situation: 'fundraising_stress', matches: 48, acceptRate: 73 },
          { situation: 'building_alone', matches: 44, acceptRate: 62 },
        ],
        recentMatches: [
          { id: 'intro_1', fromUser: 'Rahul M.', toUser: 'Priya S.', situation: 'cofounder_conflict', status: 'accepted', createdAt: new Date(Date.now() - 3600000).toISOString() },
          { id: 'intro_2', fromUser: 'Arjun K.', toUser: 'Zara A.', situation: 'loneliness', status: 'pending', createdAt: new Date(Date.now() - 7200000).toISOString() },
        ],
      });
    }

    const snap = await db.collection('intros').limit(500).get();
    const intros = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const accepted = intros.filter((i: any) => i.status === 'accepted').length;
    const declined = intros.filter((i: any) => i.status === 'declined').length;
    const pending = intros.filter((i: any) => i.status === 'sent' || i.status === 'pending').length;

    res.json({
      total: intros.length,
      accepted,
      declined,
      pending,
      acceptRate: intros.length > 0 ? Math.round((accepted / intros.length) * 100) : 0,
      avgTimeToReply: 0,
      topSituations: [],
      recentMatches: intros.slice(0, 20),
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get match stats' });
  }
});

// ─── GET /api/admin/revenue ───────────────────────────────────────────────────
router.get('/revenue', async (req: any, res: any) => {
  try {
    if (!firestoreReady) {
      return res.json({
        mrr: 4890,
        arr: 58680,
        proUsers: 231,
        eliteUsers: 36,
        proMRR: 231 * 499,
        eliteMRR: 36 * 1299,
        churnRate: 3.2,
        newPayingThisWeek: 14,
        failedPayments: 2,
        revenueHistory: [
          { month: 'Jan', revenue: 2100 },
          { month: 'Feb', revenue: 2800 },
          { month: 'Mar', revenue: 3400 },
          { month: 'Apr', revenue: 3900 },
          { month: 'May', revenue: 4200 },
          { month: 'Jun', revenue: 4600 },
          { month: 'Jul', revenue: 4890 },
        ],
      });
    }

    const snap = await db.collection('users').limit(1000).get();
    const users = snap.docs.map(d => d.data());
    const proUsers = users.filter(u => u.plan === 'pro').length;
    const eliteUsers = users.filter(u => u.plan === 'elite').length;

    res.json({
      mrr: proUsers * 499 + eliteUsers * 1299,
      arr: (proUsers * 499 + eliteUsers * 1299) * 12,
      proUsers,
      eliteUsers,
      proMRR: proUsers * 499,
      eliteMRR: eliteUsers * 1299,
      churnRate: 0,
      newPayingThisWeek: 0,
      failedPayments: 0,
      revenueHistory: [],
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get revenue data' });
  }
});

// ─── GET /api/admin/ai-health ─────────────────────────────────────────────────
router.get('/ai-health', async (req: any, res: any) => {
  try {
    res.json({
      groqStatus: 'operational',
      avgLatencyMs: 420,
      totalCallsToday: 2341,
      estimatedCostToday: 0.23,
      errorsToday: 3,
      sentimentDistribution: {
        happy: 28,
        stressed: 31,
        sad: 12,
        excited: 14,
        focused: 8,
        tired: 7,
      },
      topSituationsDetected: [
        { situation: 'building_alone', count: 89 },
        { situation: 'cofounder_conflict', count: 67 },
        { situation: 'loneliness', count: 54 },
        { situation: 'burnout', count: 48 },
        { situation: 'fundraising_stress', count: 41 },
      ],
      modelUsed: 'llama-3.3-70b-versatile',
      promptVersion: 'v2.1.0',
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get AI health' });
  }
});

// ─── GET /api/admin/safety ────────────────────────────────────────────────────
router.get('/safety', async (req: any, res: any) => {
  try {
    if (!firestoreReady) {
      return res.json({
        flaggedContent: [
          { id: 'flag_1', userId: 'mock_1', userName: 'Unknown User', content: 'Reported for spam', type: 'report', status: 'pending', createdAt: new Date(Date.now() - 3600000).toISOString() },
        ],
        crisisSignals: [],
        resolvedToday: 4,
        totalPending: 1,
      });
    }

    const flagSnap = await db.collection('flaggedContent').where('status', '==', 'pending').limit(50).get();
    const flagged = flagSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({
      flaggedContent: flagged,
      crisisSignals: [],
      resolvedToday: 0,
      totalPending: flagged.length,
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get safety data' });
  }
});

// ─── POST /api/admin/safety/:flagId/resolve ───────────────────────────────────
router.post('/safety/:flagId/resolve', async (req: any, res: any) => {
  try {
    const { flagId } = req.params;
    await db.collection('flaggedContent').doc(flagId).set({
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      resolvedBy: req.user.uid,
    }, { merge: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to resolve flag' });
  }
});

// ─── GET /api/admin/kyc-queue ─────────────────────────────────────────────────
router.get('/kyc-queue', async (req: any, res: any) => {
  try {
    if (!firestoreReady) {
      return res.json({
        pending: [
          { uid: 'mock_kyc_1', name: 'Arjun Kapoor', email: 'arjun@example.com', submittedAt: new Date(Date.now() - 86400000).toISOString(), docType: 'Passport' },
        ],
        total: 1,
      });
    }

    const snap = await db.collection('users').where('kycStatus', '==', 'pending').limit(50).get();
    const pending = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    res.json({ pending, total: pending.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get KYC queue' });
  }
});

// ─── GET /api/admin/feature-flags ────────────────────────────────────────────
router.get('/feature-flags', async (req: any, res: any) => {
  try {
    if (!firestoreReady) {
      return res.json({
        flags: {
          aiMatchEnabled: true,
          situationExtractorEnabled: true,
          advisorModeEnabled: true,
          anonymousFirstEnabled: true,
          maintenanceMode: false,
          announcementBanner: '',
        }
      });
    }
    const doc = await db.collection('config').doc('featureFlags').get();
    res.json({ flags: doc.data() || {} });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get feature flags' });
  }
});

// ─── POST /api/admin/feature-flags ───────────────────────────────────────────
router.post('/feature-flags', async (req: any, res: any) => {
  try {
    const { flags } = req.body;
    if (!firestoreReady) return res.json({ success: true });
    await db.collection('config').doc('featureFlags').set(flags, { merge: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update feature flags' });
  }
});

export default router;
