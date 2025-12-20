import express from 'express';
import { toNodeHandler } from 'better-auth/node';

const createAuthRouter = (auth) => {
  if (!auth) {
    throw new Error('Auth object must be provided to createAuthRouter.');
  }
  const router = express.Router();

  // Health check endpoint specific to auth (can be removed if global /health is sufficient)
  router.get('/auth-health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Auth routes are accessible',
      timestamp: new Date().toISOString()
    });
  });

  // Custom get-session endpoint with proper JSON structure
  router.get('/get-session', async (req, res) => {
    try {
      // CRITICAL: Prevent 304 Not Modified caching
      // Session data must ALWAYS be fresh to avoid stale authentication state
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Log request for debugging
      console.log('[get-session] Request received from origin:', req.headers.origin);
      console.log('[get-session] Cookies:', req.headers.cookie);

      const session = await auth.api.getSession({ headers: req.headers });

      if (!session) {
        console.log('[get-session] No session found');
        return res.json({
          success: false,
          session: null,
          message: 'No session found'
        });
      }

      console.log('[get-session] Session found for user:', session.user?.email);
      return res.json({
        success: true,
        session: session
      });
    } catch (error) {
      console.error('[get-session] Error getting session:', error);
      return res.status(500).json({
        success: false,
        session: null,
        message: 'Error retrieving session',
        error: error.message
      });
    }
  });

  // Better Auth handler - handles all /api/auth/* routes
  router.all('/*', toNodeHandler(auth));

  return router;
};

export default createAuthRouter;
