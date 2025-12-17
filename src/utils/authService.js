import { betterAuth } from 'better-auth';
import config from '../config/index.js'; // Assuming config will have BETTER_AUTH_SECRET

export const initializeAuth = (databasePool) => {
  if (!databasePool) {
    throw new Error('Database pool must be initialized before calling initializeAuth.');
  }

  const auth = betterAuth({
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
