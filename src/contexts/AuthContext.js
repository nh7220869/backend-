import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authClient } from '../lib/auth-client';

const AuthContext = createContext(null);

// LocalStorage keys for session backup
const STORAGE_KEYS = {
  SESSION: 'ai_book_session',
  USER: 'ai_book_user',
  TIMESTAMP: 'ai_book_session_timestamp',
  TOKEN: 'ai_book_jwt_token'
};

// Helper: Save session to localStorage as backup
const saveSessionToStorage = (session, user, token = null) => {
  if (typeof window === 'undefined') return;

  try {
    if (session && user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
      if (token) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      }
      console.log('💾 Session backed up to localStorage');
    }
  } catch (err) {
    console.warn('Failed to save session to localStorage:', err);
  }
};

// Helper: Load session from localStorage
const loadSessionFromStorage = () => {
  if (typeof window === 'undefined') return null;

  try {
    const sessionStr = localStorage.getItem(STORAGE_KEYS.SESSION);
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);

    if (sessionStr && userStr && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      // Check if backup is still valid
      if (age < maxAge) {
        return {
          session: JSON.parse(sessionStr),
          user: JSON.parse(userStr)
        };
      } else {
        console.log('ℹ️ Stored session expired, clearing localStorage');
        clearSessionFromStorage();
      }
    }
  } catch (err) {
    console.warn('Failed to load session from localStorage:', err);
  }

  return null;
};

// Helper: Clear session from localStorage
const clearSessionFromStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TIMESTAMP);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    console.log('🗑️ Session cleared from localStorage');
  } catch (err) {
    console.warn('Failed to clear session from localStorage:', err);
  }
};

// Helper: Get stored JWT token
export const getAuthToken = () => {
  if (typeof window === 'undefined') return null;

  try {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  } catch (err) {
    console.warn('Failed to get token from localStorage:', err);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current session on mount (page load/reload)
  useEffect(() => {
    const loadSession = async () => {
      console.log('🔄 Loading session on mount...');

      // Step 1: Try to load from localStorage first (instant UI feedback)
      const storedSession = loadSessionFromStorage();
      if (storedSession) {
        setSession(storedSession.session);
        setUser(storedSession.user);
        console.log('⚡ Session loaded from localStorage (instant restore)');
      }

      try {
        // Step 2: Validate with backend (get-session API)
        // This reads the session cookie and validates it with the backend
        const { data, error } = await authClient.getSession();

        if (data && !error && data.session) {
          // Session is valid - update state and localStorage
          setSession(data.session);
          setUser(data.user);
          saveSessionToStorage(data.session, data.user);
          console.log('✅ Session validated and restored from backend:', {
            userId: data.user?.id,
            email: data.user?.email,
            sessionId: data.session?.id,
          });
        } else {
          // No valid session from backend
          if (storedSession) {
            console.log('⚠️ Backend session expired, clearing localStorage');
            clearSessionFromStorage();
          } else {
            console.log('ℹ️ No active session found (user not logged in)');
          }
          setSession(null);
          setUser(null);
        }
      } catch (err) {
        console.error('❌ Error loading session from backend:', err);
        // Keep localStorage session if backend fails (offline support)
        if (!storedSession) {
          setSession(null);
          setUser(null);
        } else {
          console.log('📴 Using cached session (backend unreachable)');
        }
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  // Sign up function
  const signup = useCallback(async (name, email, password, additionalData = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: signupError } = await authClient.signUp.email({
        name,
        email,
        password,
        softwareBackground: additionalData.softwareBackground || '',
        hardwareBackground: additionalData.hardwareBackground || '',
        experienceLevel: additionalData.experienceLevel || 'beginner',
      });

      if (signupError) {
        const errorMessage = signupError.message || 'Signup failed';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }

      // Extract JWT token from response (if present)
      const jwtToken = data?.token || data?.accessToken || data?.jwt;

      // CRITICAL: Store JWT token IMMEDIATELY before any other API calls
      if (jwtToken) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, jwtToken);
        console.log('✅ JWT token stored immediately after signup');
      }

      // Set user and session from signup response
      if (data?.user) {
        setUser(data.user);
      }
      if (data?.session) {
        setSession(data.session);
      }

      // CRITICAL: Now call get-session API with token in headers
      console.log('✅ Signup successful, calling get-session API...');
      const { data: sessionData, error: sessionError } = await authClient.getSession();

      if (sessionData && !sessionError) {
        setSession(sessionData.session);
        setUser(sessionData.user);
        // Save full session to localStorage as backup
        saveSessionToStorage(sessionData.session, sessionData.user, jwtToken);
        console.log('✅ Session validated via get-session API:', {
          userId: sessionData.user?.id,
          sessionId: sessionData.session?.id,
          hasToken: !!jwtToken,
          emailVerified: sessionData.user?.emailVerified,
        });
      } else {
        console.warn('⚠️ get-session returned no data after signup');
        // Still save the session data we have
        if (jwtToken) {
          saveSessionToStorage(data.session, data.user, jwtToken);
        }
      }

      setLoading(false);
      return { success: true, user: sessionData?.user || data?.user };
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err.message || 'Network error or server unavailable';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign in function
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: loginError } = await authClient.signIn.email({
        email,
        password,
      });

      if (loginError) {
        const errorMessage = loginError.message || 'Login failed';
        setError(errorMessage);
        setLoading(false);
        return { success: false, error: errorMessage };
      }

      // Extract JWT token from response (if present)
      const jwtToken = data?.token || data?.accessToken || data?.jwt;

      // CRITICAL: Store JWT token IMMEDIATELY before any other API calls
      if (jwtToken) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, jwtToken);
        console.log('✅ JWT token stored immediately after login');
      }

      // Set user and session from login response
      if (data?.user) {
        setUser(data.user);
      }
      if (data?.session) {
        setSession(data.session);
      }

      // CRITICAL: Now call get-session API with token in headers
      console.log('✅ Login successful, calling get-session API...');
      const { data: sessionData, error: sessionError } = await authClient.getSession();

      if (sessionData && !sessionError) {
        setSession(sessionData.session);
        setUser(sessionData.user);
        // Save full session to localStorage as backup
        saveSessionToStorage(sessionData.session, sessionData.user, jwtToken);
        console.log('✅ Session validated via get-session API:', {
          userId: sessionData.user?.id,
          sessionId: sessionData.session?.id,
          hasToken: !!jwtToken,
          emailVerified: sessionData.user?.emailVerified,
        });
      } else {
        console.warn('⚠️ get-session returned no data after login');
        // Still save the session data we have
        if (jwtToken) {
          saveSessionToStorage(data.session, data.user, jwtToken);
        }
      }

      setLoading(false);
      return { success: true, user: sessionData?.user || data?.user };
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Network error or server unavailable';
      setError(errorMessage);
      setLoading(false);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Sign out function
  const logout = useCallback(async () => {
    setLoading(true);

    try {
      await authClient.signOut();

      setUser(null);
      setSession(null);
      setError(null);
      // CRITICAL: Clear localStorage backup
      clearSessionFromStorage();
      console.log('✅ Logged out successfully');

      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      // Still clear local state even if request fails
      setUser(null);
      setSession(null);
      clearSessionFromStorage();
      return { success: true };
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await authClient.getSession();

      if (data && !error) {
        setSession(data.session);
        setUser(data.user);
        return { success: true };
      }

      setSession(null);
      setUser(null);
      return { success: false, error: 'Session expired' };
    } catch (err) {
      console.error('Error refreshing session:', err);
      return { success: false, error: 'Network error' };
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    user,
    session,
    isAuthenticated: !!user && !!session,
    emailVerified: user?.emailVerified || false,
    loading,
    error,
    login,
    signup,
    logout,
    refreshSession,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
