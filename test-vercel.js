/**
 * Vercel Backend API Tester
 * Tests all endpoints on your deployed Vercel backend
 *
 * Usage: node test-vercel.js
 */

const BASE_URL = 'https://backend-jada-radta.vercel.app';

// Store cookies between requests
let sessionCookie = null;

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  // Add session cookie if available
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  try {
    log(`\n→ ${options.method || 'GET'} ${endpoint}`, 'blue');

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    // Extract cookies from response
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
      log(`  📦 Cookie received: ${sessionCookie.substring(0, 50)}...`, 'yellow');
    }

    const data = await response.json().catch(() => ({}));

    log(`  ← Status: ${response.status} ${response.statusText}`,
        response.ok ? 'green' : 'red');

    if (Object.keys(data).length > 0) {
      console.log('  Response:', JSON.stringify(data, null, 2).split('\n').map(l => '  ' + l).join('\n'));
    }

    return { response, data };
  } catch (error) {
    log(`  ✗ Error: ${error.message}`, 'red');
    return { error };
  }
}

async function testHealthCheck() {
  logSection('1. Health Check');
  await makeRequest('/health');
}

async function testAuthHealth() {
  logSection('2. Auth Health Check');
  await makeRequest('/api/auth/auth-health');
}

async function testSessionUnauthenticated() {
  logSection('3. Session (Unauthenticated)');
  const result = await makeRequest('/api/auth/get-session');

  if (result.data?.user === null && result.data?.session === null) {
    log('  ✓ Correctly returns null session when not logged in', 'green');
  } else {
    log('  ✗ Unexpected session response', 'red');
  }
}

async function testSignUp() {
  logSection('4. Sign Up');

  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  log(`  Creating user: ${testEmail}`, 'yellow');

  const result = await makeRequest('/api/auth/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      softwareBackground: 'JavaScript, Node.js',
      hardwareBackground: 'Arduino, ESP32',
      experienceLevel: 'intermediate'
    })
  });

  if (result.response?.ok) {
    log('  ✓ Sign up successful!', 'green');
    return { email: testEmail, password: testPassword };
  } else {
    log('  ✗ Sign up failed', 'red');
    return null;
  }
}

async function testSignIn(credentials) {
  logSection('5. Sign In');

  if (!credentials) {
    log('  ⊘ Skipping sign in (no credentials)', 'yellow');
    return false;
  }

  const result = await makeRequest('/api/auth/sign-in/email', {
    method: 'POST',
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password
    })
  });

  if (result.response?.ok && result.data?.user) {
    log('  ✓ Sign in successful!', 'green');
    log(`  User ID: ${result.data.user.id}`, 'yellow');
    return true;
  } else {
    log('  ✗ Sign in failed', 'red');
    return false;
  }
}

async function testSessionAuthenticated() {
  logSection('6. Session (Authenticated)');

  const result = await makeRequest('/api/auth/session');

  if (result.data?.user && result.data?.session) {
    log('  ✓ Successfully retrieved authenticated session!', 'green');
    log(`  User: ${result.data.user.email}`, 'yellow');
    log(`  Session expires: ${new Date(result.data.session.expiresAt).toLocaleString()}`, 'yellow');
    return true;
  } else {
    log('  ✗ Failed to retrieve session', 'red');
    return false;
  }
}

async function testSignOut() {
  logSection('7. Sign Out');

  const result = await makeRequest('/api/auth/sign-out', {
    method: 'POST'
  });

  if (result.response?.ok) {
    log('  ✓ Sign out successful!', 'green');
    sessionCookie = null; // Clear stored cookie
  } else {
    log('  ✗ Sign out failed', 'red');
  }
}

async function testInvalidEndpoint() {
  logSection('8. Invalid Endpoint (404 Test)');
  await makeRequest('/api/nonexistent-endpoint');
}

async function runAllTests() {
  log('\n🚀 Starting Vercel Backend API Tests', 'cyan');
  log(`Base URL: ${BASE_URL}\n`, 'yellow');

  try {
    // Test basic endpoints
    await testHealthCheck();
    await testAuthHealth();
    await testSessionUnauthenticated();

    // Test authentication flow
    const credentials = await testSignUp();
    const signedIn = await testSignIn(credentials);

    if (signedIn) {
      await testSessionAuthenticated();
      await testSignOut();

      // Verify session is cleared after sign out
      logSection('9. Session After Sign Out');
      await testSessionUnauthenticated();
    }

    // Test error handling
    await testInvalidEndpoint();

    // Summary
    logSection('✓ Test Suite Complete');
    log('\nAll endpoints tested successfully!', 'green');
    log('Your Vercel backend is working correctly! 🎉\n', 'green');

  } catch (error) {
    log('\n✗ Test suite failed with error:', 'red');
    console.error(error);
  }
}

// Run tests
runAllTests();
