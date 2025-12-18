# Backend-Only Deployment Guide (Vercel)

## 🚀 Step-by-Step Deployment

### Step 1: Vercel Account Setup
1. Go to https://vercel.com
2. Sign up / Login with GitHub
3. Install Vercel CLI (optional):
   ```bash
   npm install -g vercel
   ```

### Step 2: Deploy Backend to Vercel

#### Option A: Using Vercel Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Click "Add New Project"
3. Import your Git repository
4. **IMPORTANT**: Set Root Directory to `central-backend`
5. Framework Preset: Other
6. Build Command: (leave empty)
7. Output Directory: (leave empty)
8. Install Command: `npm install`
9. Click "Deploy"

#### Option B: Using Vercel CLI

```bash
# Navigate to backend folder
cd central-backend

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### Step 3: Set Environment Variables in Vercel

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add these:

```bash
NODE_ENV=production
BETTER_AUTH_SECRET=a3f8c9d2e1b4a7c6f5d8e2b1a4c7f6d9e3b2a5c8f7d1e4b3a6c9f2d5e8b1a4c7
BETTER_AUTH_URL=https://your-backend-url.vercel.app
DATABASE_URL=postgresql://neondb_owner:npg_iKdfhC9Iz5uN@ep-shiny-bar-adtgsazt-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
QDRANT_URL=https://9fa006fd-c8ea-4b97-bdbf-e1679c7a7db1.europe-west3-0.gcp.cloud.qdrant.io
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.qP5-vZs2UE7lQG_f_hQK1HZvy9Gva_LVGo-UkmX5i1I
OPENROUTER_API_KEY=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
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_CHAT_MODEL=google/gemini-2.0-flash-exp:free
OPENROUTER_EMBEDDING_MODEL=openai/text-embedding-3-small
```

**⚠️ IMPORTANT**: Replace `your-backend-url.vercel.app` in `BETTER_AUTH_URL` with your actual Vercel URL after deployment.

### Step 4: Test Your Backend

After deployment, you'll get a URL like: `https://your-backend-name.vercel.app`

Test these endpoints:

1. **Health Check**:
   ```bash
   curl https://your-backend-name.vercel.app/health
   ```

2. **Auth Health**:
   ```bash
   curl https://your-backend-name.vercel.app/api/auth/auth-health
   ```

3. **Chat** (POST request):
   ```bash
   curl -X POST https://your-backend-name.vercel.app/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}'
   ```

### Step 5: Update Frontend to Use Backend URL

Once backend is deployed, update your frontend:

1. Create/Update `.env.local` in project root:
   ```bash
   API_BASE_URL=https://your-backend-name.vercel.app
   ```

2. Start frontend locally:
   ```bash
   npm start
   ```

Your frontend will now call the deployed backend!

## 📁 Backend Structure

```
central-backend/
├── api/
│   └── index.js          # Vercel serverless handler ✅
├── src/
│   ├── app.js           # Express app
│   ├── config/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── personalization.js
│   │   └── translation.js
│   └── utils/
├── server.js            # Local development only
├── vercel.json          # Vercel configuration ✅
└── package.json         # Dependencies ✅
```

## 🔧 How It Works

1. **Vercel routes ALL requests** to `api/index.js`
2. `api/index.js` initializes services and forwards to Express app
3. Express app handles routing via `/src/routes/`
4. Services connect to Postgres (Neon) and Qdrant

## ✅ Available API Endpoints

Your backend provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/api/auth/sign-up/email` | POST | User registration |
| `/api/auth/sign-in/email` | POST | User login |
| `/api/auth/sign-out` | POST | User logout |
| `/api/auth/session` | GET | Get session |
| `/api/auth/auth-health` | GET | Auth service health |
| `/api/translate` | POST | Translation API |
| `/api/gemini/translate` | POST | Gemini translation |
| `/api/personalize` | POST | Personalization |
| `/chat` | POST | RAG chatbot |

## 🐛 Troubleshooting

### "Not Found" Error
- Check Root Directory is set to `central-backend` in Vercel
- Verify `api/index.js` exists
- Check Vercel function logs

### Database Connection Error
- Verify `DATABASE_URL` in environment variables
- Check if Neon database is accessible
- Look at Vercel function logs

### Module Import Errors
- Make sure all dependencies are in `package.json`
- Check `"type": "module"` is set
- Redeploy after adding dependencies

### CORS Errors
- Update `src/config/index.js` to include frontend URL in `allowedOrigins`

## 📊 View Logs

```bash
# Using Vercel CLI
vercel logs

# Or go to:
# Vercel Dashboard → Your Project → Functions → Logs
```

## 🔄 Redeploy

```bash
cd central-backend
vercel --prod --force
```

## 📝 Environment Variables Checklist

After deployment, verify these are set:
- [ ] NODE_ENV
- [ ] BETTER_AUTH_SECRET
- [ ] BETTER_AUTH_URL (with your actual Vercel URL)
- [ ] DATABASE_URL
- [ ] QDRANT_URL
- [ ] QDRANT_API_KEY
- [ ] OPENROUTER_API_KEY
- [ ] OPENROUTER_BASE_URL
- [ ] OPENROUTER_CHAT_MODEL
- [ ] OPENROUTER_EMBEDDING_MODEL

## 🎯 Next Steps

1. Deploy backend ✅
2. Copy the Vercel URL
3. Update `BETTER_AUTH_URL` environment variable
4. Test all endpoints
5. Update frontend `.env.local` with backend URL
6. Run frontend locally: `npm start`
7. Enjoy! 🎉
