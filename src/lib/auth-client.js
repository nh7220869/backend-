import { createAuthClient } from 'better-auth/react';
import { getApiBaseUrl } from '../config/api';

// Helper to get JWT token from localStorage
const getStoredToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('ai_book_jwt_token');
  } catch {
    return null;
  }
};

// Create the Better Auth client with centralized API configuration
// Uses API_BASE_URL from .env - update .env for different environments
export const authClient = createAuthClient({
  baseURL: getApiBaseUrl(),
  fetchOptions: {
    credentials: 'include',
    // CRITICAL: Prevent 304 Not Modified responses
    // Force fresh data on every request to avoid stale session state
    cache: 'no-store',
    headers: () => {
      const token = getStoredToken();
      const headers = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      };

      // Add Authorization header if JWT token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return headers;
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
