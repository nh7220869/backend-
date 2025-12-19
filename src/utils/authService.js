import { betterAuth } from 'better-auth';
import config from '../config/index.js'; // Assuming config will have BETTER_AUTH_SECRET

export const initializeAuth = (databasePool) => {
  if (!databasePool) {
    throw new Error('Database pool must be initialized before calling initializeAuth.');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';

  // Set baseURL based on environment
  let baseURL;
  if (isVercel) {
    // On Vercel, use the production URL
    baseURL = process.env.BETTER_AUTH_URL || 'https://backend-jada-radta.vercel.app';
  } else {
    // Local development
    baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3001';
  }

  // Determine if we should use secure cookies based on the URL scheme
  const baseURLProtocol = new URL(baseURL).protocol;
  const shouldUseSecureCookies = baseURLProtocol === 'https:';
  const shouldUseSameSiteNone = shouldUseSecureCookies; // Only use SameSite=None with Secure

  console.log('🔐 Auth Config:', {
    baseURL,
    isProduction,
    isVercel,
    shouldUseSecureCookies,
    sameSite: shouldUseSameSiteNone ? 'none' : 'lax',
    trustedOrigins: config.cors.allowedOrigins,
    hasSecret: !!process.env.BETTER_AUTH_SECRET
  });

  const auth = betterAuth({
    baseURL,
    database: databasePool, // Use the shared database pool
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    advanced: {
      // Use secure cookies based on URL protocol (https = true, http = false)
      useSecureCookies: shouldUseSecureCookies,
      // Important for Vercel serverless
      generateId: () => crypto.randomUUID(),
      // Cookie settings for cross-origin requests
      cookies: {
        // SameSite=None is required for cross-origin cookie sharing
        // Must be used with Secure=true (HTTPS only)
        sameSite: shouldUseSameSiteNone ? 'none' : 'lax',
        // Leave domain undefined to let browser handle it
        // This allows cookies to work across different domains
        domain: undefined,
        // Set path to root to make cookie available for all routes
        path: '/',
        // HttpOnly for security (prevents JavaScript access, protects against XSS)
        httpOnly: true,
        // CRITICAL: Set maxAge to ensure cookies persist across browser reloads
        // 7 days (matches session.expiresIn) - without this, cookies are session-only
        maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      },
    },
    user: {
      additionalFields: {
        softwareBackground: {
          type: 'string',
          required: false,
          defaultValue: '',
          input: true,
        },
        hardwareBackground: {
          type: 'string',
          required: false,
          defaultValue: '',
          input: true,
        },
        experienceLevel: {
          type: 'string',
          required: false,
          defaultValue: 'beginner',
          input: true,
        },
      },
    },
    trustedOrigins: config.cors.allowedOrigins, // Use allowed origins from central config
    secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-key-change-in-production',
  });

  return auth;
};
