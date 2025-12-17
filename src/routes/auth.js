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

  // Better Auth handler - handles all /api/auth/* routes
  router.all('/*', toNodeHandler(auth));

  return router;
};

export default createAuthRouter;
