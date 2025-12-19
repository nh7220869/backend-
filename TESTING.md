# Testing Your Vercel Backend

This guide explains how to properly test your deployed Vercel backend API.

## 🚨 Important: PowerShell curl Issues

**DO NOT use PowerShell's `curl` or `Invoke-WebRequest`** for testing REST APIs. They have known issues with:
- Cookie handling
- JSON parsing
- CORS headers
- HTTP redirects

## ✅ Recommended Testing Methods

### Method 1: Node.js Test Script (Recommended)

The automated test script will test all endpoints in sequence.

**Run the test:**
```bash
node test-vercel.js
```

**What it tests:**
- ✓ Health check endpoint
- ✓ Auth health endpoint
- ✓ Session retrieval (unauthenticated)
- ✓ User sign up
- ✓ User sign in
- ✓ Session retrieval (authenticated)
- ✓ Sign out
- ✓ 404 error handling

**Expected output:**
```
🚀 Starting Vercel Backend API Tests
Base URL: https://backend-jada-radta.vercel.app

============================================================
1. Health Check
============================================================

→ GET /health
  ← Status: 200 OK
  Response: {
    "status": "ok",
    "message": "Central Backend Server is running",
    ...
  }

...
✓ Test Suite Complete
All endpoints tested successfully!
Your Vercel backend is working correctly! 🎉
```

---

### Method 2: HTML Test Page (Interactive)

Open the HTML page in your browser for interactive testing.

**Steps:**
1. Double-click `test-page.html` to open in your browser
2. The page will automatically check your session status
3. Use the buttons to test different endpoints

**Features:**
- 🟢 Visual status indicators
- 📝 Pre-filled test data
- 🔄 Automatic session management
- 📊 Real-time response display
- 🍪 Proper cookie handling

---

### Method 3: Postman

Import these endpoints into Postman:

**Base URL:** `https://backend-jada-radta.vercel.app`

#### Endpoint Collection:

**1. Health Check**
```
GET /health
```

**2. Auth Health**
```
GET /api/auth/auth-health
```

**3. Get Session**
```
GET /api/auth/session
Headers:
  Cookie: <session-cookie>
```

**4. Sign Up**
```
POST /api/auth/sign-up/email
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPassword123!",
  "name": "Test User",
  "softwareBackground": "JavaScript, Python",
  "hardwareBackground": "Arduino, Raspberry Pi",
  "experienceLevel": "beginner"
}
```

**5. Sign In**
```
POST /api/auth/sign-in/email
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```
Save the `set-cookie` header from the response!

**6. Sign Out**
```
POST /api/auth/sign-out
Headers:
  Cookie: <session-cookie-from-signin>
```

---

### Method 4: Browser DevTools

**Steps:**
1. Open `test-page.html` in your browser
2. Press `F12` to open DevTools
3. Go to Console tab
4. Run commands directly:

```javascript
// Check health
fetch('https://backend-jada-radta.vercel.app/health')
  .then(r => r.json())
  .then(console.log);

// Get session
fetch('https://backend-jada-radta.vercel.app/api/auth/session', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(console.log);

// Sign up
fetch('https://backend-jada-radta.vercel.app/api/auth/sign-up/email', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User'
  })
})
  .then(r => r.json())
  .then(console.log);
```

---

## 📋 Available Endpoints

### Health & Status

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Backend health check |
| `/api/auth/auth-health` | GET | Auth service health |

### Authentication

| Endpoint | Method | Description | Requires Auth |
|----------|--------|-------------|---------------|
| `/api/auth/sign-up/email` | POST | Create new account | No |
| `/api/auth/sign-in/email` | POST | Login to account | No |
| `/api/auth/sign-out` | POST | Logout | Yes |
| `/api/auth/session` | GET | Get current session | No* |

*Returns `null` if not authenticated

### Other APIs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/gemini/translate` | POST | Translation service |
| `/api/translate` | POST | Translation service |
| `/api/personalize` | POST | Personalization |
| `/chat` | POST | Chat endpoint |

---

## 🔍 Debugging Tips

### Check Vercel Logs

1. Go to https://vercel.com/dashboard
2. Select your project: `backend-jada-radta`
3. Click on latest deployment
4. View **Functions** tab
5. Click **View Logs**

### Common Issues

**Issue: "Session returns null after sign in"**

Solution:
```javascript
// Make sure to include credentials!
fetch('/api/auth/session', {
  credentials: 'include'  // ← REQUIRED!
})
```

**Issue: "CORS error"**

Check that your frontend domain is in the allowed origins:
```javascript
// src/config/index.js
cors: {
  allowedOrigins: [
    'https://Ai-Native-Book.vercel.app',
    'https://physical-ai-humanoid-robotics-book-eosin.vercel.app',
    'http://localhost:3000',
    // Your domain here
  ]
}
```

**Issue: "404 Not Found"**

Common mistakes:
- ❌ `/api/auth/get-session` (wrong)
- ✅ `/api/auth/session` (correct)

---

## 🧪 Testing Workflow

### Complete Authentication Flow:

1. **Check initial session** → Should return `null`
   ```
   GET /api/auth/session
   Response: {"user":null,"session":null}
   ```

2. **Sign up** → Creates account and logs in
   ```
   POST /api/auth/sign-up/email
   Response: {"user":{...},"session":{...}}
   Cookie: better_auth_session=xxx
   ```

3. **Check session** → Should return user data
   ```
   GET /api/auth/session
   Response: {"user":{...},"session":{...}}
   ```

4. **Sign out** → Clears session
   ```
   POST /api/auth/sign-out
   Response: {"success":true}
   ```

5. **Check session again** → Should return `null`
   ```
   GET /api/auth/session
   Response: {"user":null,"session":null}
   ```

---

## 📱 Testing from Your Frontend

### React Example:

```javascript
// src/utils/api.js
const API_BASE = 'https://backend-jada-radta.vercel.app';

export async function signUp(email, password, name) {
  const response = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
    method: 'POST',
    credentials: 'include',  // CRITICAL!
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, name })
  });

  return response.json();
}

export async function getSession() {
  const response = await fetch(`${API_BASE}/api/auth/session`, {
    credentials: 'include'  // CRITICAL!
  });

  return response.json();
}

// Usage in component
import { getSession } from './utils/api';

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    getSession().then(data => {
      if (data.user) {
        setSession(data);
      }
    });
  }, []);

  return (
    <div>
      {session ? (
        <p>Logged in as: {session.user.email}</p>
      ) : (
        <p>Not logged in</p>
      )}
    </div>
  );
}
```

---

## 🎯 Quick Test Commands

### Option 1: Node.js (One-liner)
```bash
node -e "fetch('https://backend-jada-radta.vercel.app/health').then(r=>r.json()).then(console.log)"
```

### Option 2: Browser Console
```javascript
fetch('https://backend-jada-radta.vercel.app/health').then(r=>r.json()).then(console.log)
```

### Option 3: Test Script
```bash
node test-vercel.js
```

### Option 4: HTML Page
```bash
# Just open test-page.html in your browser
start test-page.html
```

---

## ✅ Success Criteria

Your backend is working correctly if:

- ✓ `/health` returns status "ok"
- ✓ `/api/auth/session` returns null when not logged in
- ✓ Sign up creates a user and returns session data
- ✓ Sign in returns session data with cookie
- ✓ `/api/auth/session` returns user data after sign in
- ✓ Sign out clears the session
- ✓ All responses have proper CORS headers
- ✓ No console errors about CORS or cookies

---

## 📚 Further Reading

- [Better Auth Docs](https://www.better-auth.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Fetch API with Credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#sending_a_request_with_credentials_included)

---

Need help? Check the Vercel logs or run `node test-vercel.js` for automated testing!
