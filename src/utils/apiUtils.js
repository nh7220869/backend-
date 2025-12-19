/**
 * API Utility Functions
 *
 * Utilities to prevent HTTP 304 Not Modified caching issues
 * Ensures fresh data on every API request
 */

/**
 * Fetch with no-cache guarantee
 *
 * Prevents 304 Not Modified by:
 * 1. Adding cache-busting headers
 * 2. Adding timestamp query parameter
 * 3. Setting cache: 'no-store'
 *
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithNoCache(url, options = {}) {
  // Add timestamp to URL to force unique request
  const cacheBuster = `_t=${Date.now()}`;
  const separator = url.includes('?') ? '&' : '?';
  const urlWithCacheBuster = `${url}${separator}${cacheBuster}`;

  // Merge headers
  const headers = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    ...(options.headers || {}),
  };

  // Merge options
  const fetchOptions = {
    ...options,
    cache: 'no-store',
    headers,
  };

  console.log(`🚫 Cache-busting request to: ${urlWithCacheBuster}`);

  return fetch(urlWithCacheBuster, fetchOptions);
}

/**
 * Fetch JSON with no-cache guarantee
 *
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function fetchJsonWithNoCache(url, options = {}) {
  const response = await fetchWithNoCache(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get session with absolute cache prevention
 *
 * Use this instead of authClient.getSession() when you need to
 * guarantee fresh session data (e.g., after login/logout)
 *
 * @param {string} baseUrl - Backend base URL
 * @returns {Promise<object>} Session data
 */
export async function getSessionFresh(baseUrl) {
  const url = `${baseUrl}/api/auth/get-session`;

  try {
    const data = await fetchJsonWithNoCache(url, {
      credentials: 'include',
      method: 'GET',
    });

    console.log('✅ Fresh session data retrieved (no cache)');
    return { data, error: null };
  } catch (error) {
    console.error('❌ Error fetching fresh session:', error);
    return { data: null, error };
  }
}

/**
 * POST request with no-cache guarantee
 *
 * @param {string} url - API endpoint URL
 * @param {object} body - Request body
 * @param {object} options - Additional fetch options
 * @returns {Promise<any>} Parsed JSON response
 */
export async function postWithNoCache(url, body, options = {}) {
  return fetchJsonWithNoCache(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
    ...options,
  });
}

/**
 * Clear all browser caches programmatically
 *
 * WARNING: This is aggressive - only use when needed
 */
export function clearAllCaches() {
  // Clear Service Worker caches
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => caches.delete(name));
    });
  }

  // Clear localStorage
  try {
    localStorage.clear();
  } catch (e) {
    console.warn('Could not clear localStorage:', e);
  }

  // Clear sessionStorage
  try {
    sessionStorage.clear();
  } catch (e) {
    console.warn('Could not clear sessionStorage:', e);
  }

  console.log('🗑️ All caches cleared');
}

/**
 * Get cache-busting headers object
 * Use when making custom fetch calls
 */
export const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate, private',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export default {
  fetchWithNoCache,
  fetchJsonWithNoCache,
  getSessionFresh,
  postWithNoCache,
  clearAllCaches,
  NO_CACHE_HEADERS,
};
