/**
 * Authenticated Fetch Utilities
 *
 * Automatically attaches JWT token to all protected API requests
 */

import { getAuthToken } from '../contexts/AuthContext';

/**
 * Make an authenticated fetch request with JWT token
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const authFetch = async (url, options = {}) => {
  // Get JWT token from localStorage
  const token = getAuthToken();

  // Merge headers with Authorization header
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge options with credentials and headers
  const fetchOptions = {
    credentials: 'include', // Include cookies for cross-origin requests
    ...options,
    headers,
  };

  return fetch(url, fetchOptions);
};

/**
 * Make an authenticated POST request
 * @param {string} url - API endpoint URL
 * @param {object} body - Request body
 * @param {object} options - Additional fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const authPost = async (url, body, options = {}) => {
  return authFetch(url, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
  });
};

/**
 * Make an authenticated GET request
 * @param {string} url - API endpoint URL
 * @param {object} options - Additional fetch options
 * @returns {Promise<Response>} Fetch response
 */
export const authGet = async (url, options = {}) => {
  return authFetch(url, {
    method: 'GET',
    ...options,
  });
};

/**
 * Make authenticated POST request and parse JSON response
 * @param {string} url - API endpoint URL
 * @param {object} body - Request body
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export const authPostJson = async (url, body, options = {}) => {
  const response = await authPost(url, body, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

/**
 * Make authenticated GET request and parse JSON response
 * @param {string} url - API endpoint URL
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export const authGetJson = async (url, options = {}) => {
  const response = await authGet(url, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export default {
  authFetch,
  authPost,
  authGet,
  authPostJson,
  authGetJson,
};
