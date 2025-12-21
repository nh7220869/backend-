/**
 * CORS Configuration Middleware
 * Handles dynamic origin matching with wildcard support for Vercel deployments
 */

import config from '../config/index.js';

/**
 * Check if origin matches allowed patterns
 * @param {string} origin - The origin to check
 * @returns {boolean} - True if origin is allowed
 */
const isOriginAllowed = (origin) => {
  if (!origin) return false;

  // Check exact matches and patterns
  return config.cors.allowedOrigins.some(allowedOrigin => {
    // Exact match
    if (allowedOrigin === origin) return true;

    // Wildcard pattern matching (e.g., https://ai-native-book-*.vercel.app)
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin
        .replace(/\./g, '\\.')  // Escape dots
        .replace(/\*/g, '[^.]*'); // Replace * with regex pattern
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(origin);
    }

    return false;
  });
};

/**
 * CORS options for express cors middleware
 */
export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true, // CRITICAL: Allow cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cookie',
    'Cache-Control',
    'Pragma',
    'Expires'
  ],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 86400, // Cache preflight for 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
};

/**
 * Manual CORS headers setter for serverless functions
 * Use this when Express CORS middleware might not work properly
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
export const setCorsHeaders = (req, res) => {
  const origin = req.headers.origin;

  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie, Cache-Control, Pragma, Expires');
    res.setHeader('Access-Control-Expose-Headers', 'Set-Cookie');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
};

/**
 * Express middleware to set CORS headers manually
 * Use as a backup or alternative to cors package
 */
export const corsMiddleware = (req, res, next) => {
  setCorsHeaders(req, res);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
};

export default corsOptions;
