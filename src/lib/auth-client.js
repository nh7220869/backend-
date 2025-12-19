import { createAuthClient } from 'better-auth/react';
import { getApiBaseUrl } from '../config/api';

// Create the Better Auth client with centralized API configuration
// Uses API_BASE_URL from .env - update .env for different environments
export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
  fetchOptions: {
    credentials: 'include',
    // CRITICAL: Prevent 304 Not Modified responses
    // Force fresh data on every request to avoid stale session state
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
});

// Export the client and individual methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
} = authClient;

export default authClient;
