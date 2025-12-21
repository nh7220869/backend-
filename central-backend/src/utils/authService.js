import { betterAuth } from 'better-auth';
import config from '../config/index.js';

export const initializeAuth = (databasePool) => {
  if (!databasePool) {
    throw new Error('Database pool must be initialized before calling initializeAuth.');
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const isVercel = process.env.VERCEL === '1';

  let baseURL;
  if (isVercel) {
    baseURL = process.env.BETTER_AUTH_URL || 'https://backend-jada-radta.vercel.app';
  } else {
    baseURL = process.env.BETTER_AUTH_URL || 'http://localhost:3001';
  }

  const baseURLProtocol = new URL(baseURL).protocol;
  const shouldUseSecureCookies = baseURLProtocol === 'https:';
  const shouldUseSameSiteNone = shouldUseSecureCookies;

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
    database: databasePool,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    advanced: {
      useSecureCookies: shouldUseSecureCookies,
      generateId: () => crypto.randomUUID(),
      cookieOptions: {
        sameSite: shouldUseSameSiteNone ? 'none' : 'lax',
        secure: shouldUseSecureCookies,
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
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
    trustedOrigins: config.cors.allowedOrigins,
    secret: process.env.BETTER_AUTH_SECRET || 'fallback-secret-key-change-in-production',
  });

  return auth;
};
