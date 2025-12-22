import fetch from 'node-fetch';

// Test get-session endpoint
// NOTE: This will return null because Node.js doesn't automatically handle cookies
// You need to sign in first and use a cookie jar to maintain the session
const testSession = async () => {
  try {
    console.log('Testing /api/auth/get-session endpoint...\n');

    const res = await fetch(
      'https://backend-jada-radta.vercel.app/api/auth/get-session',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Note: credentials don't work the same way in Node.js as in browsers
        // You need to use a cookie jar to maintain sessions in Node.js
      }
    );

    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    console.log('\nExpected result: Session will be null because cookies are not automatically handled in Node.js');
    console.log('To test with a real session, you need to:');
    console.log('1. Sign in first to get a session cookie');
    console.log('2. Use a cookie jar (like tough-cookie) to store and send cookies');
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testSession();
