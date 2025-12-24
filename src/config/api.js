/**
 * API Configuration
 *
 * Centralized configuration for all API endpoints.
 * Reads from environment variables via Docusaurus siteConfig.
 *
 * Usage:
 *   import { API_CONFIG } from '@site/src/config/api';
 *   fetch(`${API_CONFIG.BASE_URL}/api/auth/sign-in/email`, {...});
 */

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * Hook to get API configuration
 * Use this in React components
 */
export const useApiConfig = () => {
  const { siteConfig } = useDocusaurusContext();

  // Remove trailing slash to ensure consistent URL formatting
  let baseUrl = siteConfig.customFields?.apiBaseUrl || 'https://noorulsehar-physical-ai-humanoid-robotics-book-backend.hf.space';
  baseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes

  return {
    BASE_URL: baseUrl,
    ENDPOINTS: {
      // Authentication
      AUTH_SIGNUP: `${baseUrl}/api/auth/sign-up/email`,
      AUTH_SIGNIN: `${baseUrl}/api/auth/sign-in/email`,
      AUTH_SIGNOUT: `${baseUrl}/api/auth/sign-out`,
      AUTH_SESSION: `${baseUrl}/api/auth/get-session`,
      AUTH_HEALTH: `${baseUrl}/api/auth/auth-health`,

      // Translation
      TRANSLATE_GEMINI: `${baseUrl}/api/gemini/translate`,
      TRANSLATE: `${baseUrl}/api/translate`,

      // Personalization
      PERSONALIZE: `${baseUrl}/api/personalize`,

      // Chat (RAG)
      CHAT: `${baseUrl}/chat`,

      // Health
      HEALTH: `${baseUrl}/health`,
    }
  };
};

/**
 * Get API base URL (for non-React contexts)
 * Works in both browser and server environments
 */
export const getApiBaseUrl = () => {
  let baseUrl;
  // Check if we're in browser
  if (typeof window !== 'undefined') {
    // Try to get from window object (set by Docusaurus)
    if (window.docusaurus?.siteConfig?.customFields?.apiBaseUrl) {
      baseUrl = window.docusaurus.siteConfig.customFields.apiBaseUrl;
    } else {
      // Fallback to production URL
      baseUrl = 'https://noorulsehar-physical-ai-humanoid-robotics-book-backend.hf.space';
    }
  } else {
    // Server-side or build-time - this won't execute in browser
    baseUrl = 'https://noorulsehar-physical-ai-humanoid-robotics-book-backend.hf.space';
  }

  // Remove trailing slashes for consistency
  return baseUrl.replace(/\/+$/, '');
};

/**
 * Static API configuration (fallback for non-React contexts)
 * This uses the runtime value when available
 */
export const API_CONFIG = {
  get BASE_URL() {
    return getApiBaseUrl();
  },
  get ENDPOINTS() {
    const baseUrl = this.BASE_URL;
    return {
      // Authentication
      AUTH_SIGNUP: `${baseUrl}/api/auth/sign-up/email`,
      AUTH_SIGNIN: `${baseUrl}/api/auth/sign-in/email`,
      AUTH_SIGNOUT: `${baseUrl}/api/auth/sign-out`,
      AUTH_SESSION: `${baseUrl}/api/auth/get-session`,
      AUTH_HEALTH: `${baseUrl}/api/auth/auth-health`,

      // Translation
      TRANSLATE_GEMINI: `${baseUrl}/api/gemini/translate`,
      TRANSLATE: `${baseUrl}/api/translate`,

      // Personalization
      PERSONALIZE: `${baseUrl}/api/personalize`,

      // Chat (RAG)
      CHAT: `${baseUrl}/chat`,

      // Health
      HEALTH: `${baseUrl}/health`,
    };
  }
};

/**
 * Helper to build API URL
 * @param {string} endpoint - Endpoint path (e.g., '/api/authget-session')
 * @returns {string} Full URL
 */
export const buildApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};
