# CORS Fix Guide for Vercel Serverless Functions

## What Was Fixed

### Problem
The CORS error was caused by:
1. **Wildcard patterns not working in arrays**: The pattern `'https://ai-native-book-*.vercel.app'` in the allowed origins array doesn't work with the `cors` package
2. **Missing CORS headers in serverless context**: Vercel serverless functions need explicit CORS headers
3. **Credentials with wildcards**: When using `credentials: true`, exact origin matching is required

### Solution Implemented

#### 1. Created Dynamic CORS Middleware (`src/middleware/corsConfig.js`)
- Supports wildcard origin matching using regex
- Properly handles credentials with dynamic origins
- Provides both Express middleware and manual header setters

#### 2. Updated App Configuration (`src/app.js`)
- Uses new CORS middleware with dynamic origin matching
- Adds backup CORS headers for reliability

#### 3. Enhanced Serverless Handler (`server.js`)
- Sets CORS headers BEFORE Express middleware runs
- Handles preflight OPTIONS requests directly
- Ensures headers are set even if middleware fails

#### 4. Added Logging (`src/routes/auth.js`)
- Logs requests to help debug CORS issues
- Shows origin and cookie information

---

## Testing the Fix

### 1. Test Locally First

```bash
# In central-backend directory
npm install

# Start local server
npm start
# Or
vercel dev
```

Test with curl:
```bash
# Test OPTIONS (preflight) request
curl -X OPTIONS http://localhost:3001/api/auth/get-session \
  -H "Origin: https://ai-native-book-tf39.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v

# Test actual GET request
curl -X GET http://localhost:3001/api/auth/get-session \
  -H "Origin: https://ai-native-book-tf39.vercel.app" \
  -H "Cookie: your-session-cookie" \
  -v
```

Expected response headers:
- `Access-Control-Allow-Origin: https://ai-native-book-tf39.vercel.app`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH`

### 2. Deploy to Vercel

```bash
# Make sure you're in the central-backend directory
cd central-backend

# Deploy to Vercel
vercel --prod

# Or if you want to deploy to preview first
vercel
```

### 3. Test from Browser Console

Once deployed, open your frontend (https://ai-native-book-tf39.vercel.app) and run this in the browser console:

```javascript
// Test CORS with fetch
fetch('https://your-backend.vercel.app/api/auth/get-session', {
  method: 'GET',
  credentials: 'include', // CRITICAL: Include cookies
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('Response status:', response.status);
  console.log('CORS headers:', {
    'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
    'access-control-allow-credentials': response.headers.get('access-control-allow-credentials')
  });
  return response.json();
})
.then(data => console.log('Session data:', data))
.catch(error => console.error('Error:', error));
```

---

## Frontend Implementation

### Correct Way to Call the API

#### Using Fetch
```javascript
const getSession = async () => {
  try {
    const response = await fetch('https://your-backend.vercel.app/api/auth/get-session', {
      method: 'GET',
      credentials: 'include', // CRITICAL: Must include credentials for cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Session:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    throw error;
  }
};
```

#### Using Axios
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://your-backend.vercel.app',
  withCredentials: true, // CRITICAL: Enable credentials
  headers: {
    'Content-Type': 'application/json',
  },
});

const getSession = async () => {
  try {
    const { data } = await api.get('/api/auth/get-session');
    console.log('Session:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch session:', error);
    throw error;
  }
};
```

#### Using Next.js API Routes (Recommended for Next.js apps)
```javascript
// pages/api/session.js (in your frontend)
export default async function handler(req, res) {
  try {
    const response = await fetch('https://your-backend.vercel.app/api/auth/get-session', {
      method: 'GET',
      headers: {
        // Forward cookies from the client
        cookie: req.headers.cookie || '',
      },
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Then in your frontend components
const getSession = async () => {
  const response = await fetch('/api/session');
  return response.json();
};
```

---

## Checking Vercel Logs

### View Logs in Real-Time
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login
vercel login

# View logs
vercel logs --follow

# View logs for specific deployment
vercel logs [deployment-url] --follow
```

### Check Logs in Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your backend project
3. Click **Deployments**
4. Click on the latest deployment
5. Click **Functions** tab
6. Click on your function (server.js)
7. View logs for CORS-related messages

Look for these log messages:
- `[get-session] Request received from origin: ...`
- `CORS: Blocked origin: ...` (if origin is not allowed)
- `[get-session] Session found for user: ...`

---

## Troubleshooting

### Issue: Still getting CORS error

**Check 1: Verify origin is in allowed list**
```javascript
// In config/index.js, make sure your frontend URL is listed
cors: {
  allowedOrigins: [
    'https://ai-native-book-tf39.vercel.app', // ✅ Your frontend
    'https://ai-native-book-*.vercel.app',    // ✅ Wildcard for preview deployments
    // ... other origins
  ],
}
```

**Check 2: Verify credentials are included**
```javascript
// Frontend must include credentials
fetch(url, {
  credentials: 'include' // ✅ Must be set
});

// Or with axios
axios.create({
  withCredentials: true // ✅ Must be set
});
```

**Check 3: Check browser console**
- Look for specific CORS error messages
- Check if it's a preflight (OPTIONS) or actual request failing
- Verify the request headers being sent

**Check 4: Verify deployment**
```bash
# Make sure latest changes are deployed
vercel --prod

# Check deployment logs
vercel logs --follow
```

### Issue: Session is null

**Check 1: Verify user is logged in**
```javascript
// Check cookies in browser
console.log(document.cookie);
```

**Check 2: Verify cookie domain**
- Cookies must be set for the correct domain
- Check that `SameSite` attribute is set correctly
- For cross-domain cookies, ensure `Secure` flag is set (HTTPS only)

**Check 3: Check backend logs**
```bash
vercel logs --follow
# Look for: "[get-session] Cookies: ..."
```

### Issue: 500 Internal Server Error

**Check 1: View detailed error logs**
```bash
vercel logs --follow
```

**Check 2: Test locally first**
```bash
vercel dev
# Test the endpoint locally to see detailed error messages
```

---

## Environment Variables

Make sure these environment variables are set in Vercel:

```bash
# Required
DATABASE_URL=your-postgres-connection-string
OPENROUTER_API_KEY=your-openrouter-api-key

# Optional but recommended
QDRANT_URL=your-qdrant-url
QDRANT_API_KEY=your-qdrant-api-key
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=https://your-backend.vercel.app
```

Set them in Vercel:
1. Go to your project settings
2. Click **Environment Variables**
3. Add each variable
4. Redeploy after adding variables

---

## Summary of Changes

### Files Modified
1. ✅ `src/middleware/corsConfig.js` (NEW) - Dynamic CORS configuration
2. ✅ `src/app.js` - Updated to use new CORS middleware
3. ✅ `server.js` - Added explicit CORS headers for serverless
4. ✅ `src/routes/auth.js` - Added logging for debugging

### Key Features
- ✅ Wildcard origin matching (`https://ai-native-book-*.vercel.app`)
- ✅ Credentials support with dynamic origins
- ✅ Preflight request handling
- ✅ Backup CORS headers for reliability
- ✅ Comprehensive logging for debugging

### Next Steps
1. Deploy to Vercel: `vercel --prod`
2. Test from your frontend
3. Check logs if issues persist
4. Verify cookies are being sent

---

## Need More Help?

If you're still experiencing issues:

1. Check Vercel logs: `vercel logs --follow`
2. Test with browser DevTools Network tab
3. Verify environment variables are set
4. Ensure you're using HTTPS (required for credentials)
5. Check that cookies are not blocked by browser settings
