/**
 * Frontend API Helper - Example Implementation
 *
 * This file demonstrates how to properly handle authentication
 * cookies in a cross-domain setup with your backend.
 *
 * CRITICAL: You MUST use credentials: 'include' in ALL API calls
 * to ensure cookies are sent and received across domains.
 */

const API_BASE_URL = 'https://backend-jada-radta.vercel.app';

/**
 * Base fetch wrapper that ALWAYS includes credentials
 * This ensures cookies are sent with every request
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const config = {
    ...options,
    credentials: 'include', // ← CRITICAL: This sends cookies cross-domain
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Authentication API methods
 */
const authAPI = {
  /**
   * Sign up a new user
   */
  signUp: async (email, password, additionalFields = {}) => {
    return apiFetch('/api/auth/sign-up/email', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        ...additionalFields,
      }),
    });
  },

  /**
   * Sign in an existing user
   * The session cookie is automatically stored by the browser
   */
  signIn: async (email, password) => {
    return apiFetch('/api/auth/sign-in/email', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  /**
   * Get current session
   * This should work after page reload if cookies are configured correctly
   */
  getSession: async () => {
    return apiFetch('/api/auth/get-session', {
      method: 'GET',
    });
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    return apiFetch('/api/auth/sign-out', {
      method: 'POST',
    });
  },
};

/**
 * Session management hook for React/Next.js
 * This demonstrates how to check session on page load
 */
async function initializeAuth() {
  try {
    console.log('🔐 Checking for existing session...');
    const response = await authAPI.getSession();

    if (response.success && response.session) {
      console.log('✅ Session found:', response.session.user);
      return response.session;
    } else {
      console.log('ℹ️ No active session');
      return null;
    }
  } catch (error) {
    console.error('❌ Session check failed:', error);
    return null;
  }
}

/**
 * Complete authentication flow example
 */
async function exampleAuthFlow() {
  try {
    // 1. Sign in
    console.log('Step 1: Signing in...');
    const signInResponse = await authAPI.signIn('user@example.com', 'password123');
    console.log('✅ Signed in:', signInResponse);

    // 2. Get session immediately after login
    console.log('\nStep 2: Getting session after login...');
    const sessionAfterLogin = await authAPI.getSession();
    console.log('✅ Session after login:', sessionAfterLogin);

    // 3. Simulate page reload by calling getSession again
    console.log('\nStep 3: Simulating page reload - getting session again...');
    const sessionAfterReload = await authAPI.getSession();
    console.log('✅ Session after reload:', sessionAfterReload);

    // If both sessions work, cookies are configured correctly!
    if (sessionAfterLogin.success && sessionAfterReload.success) {
      console.log('\n🎉 SUCCESS: Cookies persist across requests!');
    }

  } catch (error) {
    console.error('\n❌ Authentication flow failed:', error);
  }
}

/**
 * React Component Example
 */
const ReactComponentExample = `
import { useState, useEffect } from 'react';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for session on component mount (page load)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await authAPI.getSession();
        if (response.success && response.session) {
          setSession(response.session);
        }
      } catch (error) {
        console.error('Session check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []); // Empty dependency array = run once on mount

  const handleLogin = async (email, password) => {
    try {
      await authAPI.signIn(email, password);
      // After successful login, get the session
      const response = await authAPI.getSession();
      if (response.success) {
        setSession(response.session);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.signOut();
      setSession(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {session ? (
        <div>
          <h1>Welcome, {session.user.email}!</h1>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <h1>Please login</h1>
          <button onClick={() => handleLogin('user@example.com', 'password123')}>
            Login
          </button>
        </div>
      )}
    </div>
  );
}
`;

/**
 * Next.js App Router Example (app directory)
 */
const NextJsAppRouterExample = `
// app/providers/AuthProvider.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check session on app load
    fetch('https://backend-jada-radta.vercel.app/api/auth/get-session', {
      credentials: 'include', // ← CRITICAL
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.session) {
          setSession(data.session);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ session, setSession, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// app/layout.tsx
import { AuthProvider } from './providers/AuthProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

// app/page.tsx
'use client';

import { useAuth } from './providers/AuthProvider';

export default function HomePage() {
  const { session, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {session ? (
        <h1>Welcome back, {session.user.email}!</h1>
      ) : (
        <h1>Please login</h1>
      )}
    </div>
  );
}
`;

// Export for use in browser
if (typeof window !== 'undefined') {
  window.authAPI = authAPI;
  window.initializeAuth = initializeAuth;
  window.exampleAuthFlow = exampleAuthFlow;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    authAPI,
    initializeAuth,
    exampleAuthFlow,
  };
}

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Frontend API Helper - Ready to Use                            ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  CRITICAL REQUIREMENTS:                                        ║
║  ✓ Use credentials: 'include' in ALL fetch requests           ║
║  ✓ Use withCredentials: true if using Axios                   ║
║  ✓ Call getSession() on page load to restore session          ║
║                                                                ║
║  Available in browser console:                                 ║
║  • authAPI.signIn(email, password)                            ║
║  • authAPI.getSession()                                       ║
║  • authAPI.signOut()                                          ║
║  • exampleAuthFlow() - Test complete flow                     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
