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
      const session = await auth.api.getSession({ headers: req.headers });

      if (!session) {
        return res.json({
          success: false,
          session: null,
          message: 'No session found'
        });
      }

      return res.json({
        success: true,
        session: session
      });
    } catch (error) {
      console.error('Error getting session:', error);
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
