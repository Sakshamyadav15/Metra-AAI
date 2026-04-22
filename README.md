# Metra AAI

Metra AAI is an AI-powered email triage platform that connects to Gmail, classifies incoming emails by priority, drafts replies, and tracks operational history for audit and insights.

This workspace is organized for a split deployment:
- Frontend: Next.js application in `frontend`
- Backend: Node.js/Express API in `email-triage-agent/server`

Primary hosting target:
- Backend on Hugging Face Space (Docker): `https://huggingface.co/spaces/Sakshamyadav15/AAI`
- Frontend on Vercel

## 1. Repository Layout

- `frontend`: Vercel-deployable Next.js application
- `email-triage-agent/server`: Render-deployable backend API
- `Dockerfile`: Hugging Face Spaces Docker runtime for backend
- `.dockerignore`: backend-focused Docker build context filtering
- `render.yaml`: Render Blueprint for backend service
- `.gitignore`: Root-level ignore rules to avoid committing archives/docs/local artifacts

Notes:
- Legacy files and archives in the workspace are ignored by root `.gitignore`.
- Do not commit `.env` files or local SQLite database files.

## 2. Local Development

### 2.1 Frontend

From workspace root:

```powershell
npm run dev --prefix frontend
```

Default URL:
- `http://localhost:3000`

### 2.2 Backend

From workspace root:

```powershell
npm run dev --prefix email-triage-agent/server
```

Default URL:
- `http://localhost:5000`

Health check:
- `http://localhost:5000/api/health`

## 3. Environment Variables

## 3.1 Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

For production (Vercel):

```env
NEXT_PUBLIC_API_BASE_URL=https://YOUR_RENDER_BACKEND_DOMAIN
```

## 3.2 Backend (`email-triage-agent/.env` locally, Render dashboard in production)

Required for live mode:

```env
PORT=5000
CLIENT_ORIGIN=http://localhost:3000
SESSION_SECRET=CHANGE_ME
MOCK_MODE=false

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback

MODEL_PROVIDER=groq
GROQ_API_KEY=...
GROQ_CLASSIFY_MODEL=llama-3.1-8b-instant
GROQ_DRAFT_MODEL=llama-3.3-70b-versatile
TRIAGE_MAX_EMAILS=10

ASYNC_TRIAGE=true
REDIS_REQUIRED=false
REDIS_URL=
```

For production, set:
- `CLIENT_ORIGIN=https://YOUR_VERCEL_FRONTEND_DOMAIN`
- `GOOGLE_REDIRECT_URI=https://YOUR_RENDER_BACKEND_DOMAIN/api/auth/callback`

## 4. Google OAuth and Gmail API Setup

1. Open Google Cloud Console.
2. Enable Gmail API for your project.
3. Configure OAuth consent screen.
4. Create OAuth client credentials (Web application).
5. Add Authorized redirect URI:
   - Local: `http://localhost:5000/api/auth/callback`
   - Production: `https://YOUR_RENDER_BACKEND_DOMAIN/api/auth/callback`
6. Add Authorized JavaScript origin:
   - Local frontend: `http://localhost:3000`
   - Production frontend: `https://YOUR_VERCEL_FRONTEND_DOMAIN`
7. Copy `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` into backend environment variables.

## 5. Deploy Backend on Render

Option A: Use `render.yaml` Blueprint
1. Push code to GitHub.
2. In Render, create a new Blueprint instance.
3. Select the repository.
4. Render reads `render.yaml` and creates the backend service.
5. Fill all `sync: false` environment variables in Render dashboard.
6. Deploy.

Option B: Manual Web Service
1. Create Web Service from GitHub repository.
2. Root Directory: `email-triage-agent/server`
3. Build Command: `npm install`
4. Start Command: `npm run start`
5. Add required environment variables.
6. Deploy and note backend URL.

## 5B. Deploy Backend on Hugging Face Spaces (Docker)

This repository includes a root `Dockerfile` specifically for backend deployment to Hugging Face Spaces.

Target Space:
- `https://huggingface.co/spaces/Sakshamyadav15/AAI`

Steps:
1. Open your Space settings and confirm SDK is set to `Docker`.
2. Connect the Space to this repository/branch (or push the same files to the Space repo).
3. Ensure the root `Dockerfile` is present.
4. Add Space Secrets:

```env
PORT=7860
NODE_ENV=production
CLIENT_ORIGIN=https://YOUR_VERCEL_APP.vercel.app
SESSION_SECRET=CHANGE_ME
MOCK_MODE=false

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://sakshamyadav15-aai.hf.space/api/auth/callback

MODEL_PROVIDER=groq
GROQ_API_KEY=...
GROQ_CLASSIFY_MODEL=llama-3.1-8b-instant
GROQ_DRAFT_MODEL=llama-3.3-70b-versatile
TRIAGE_MAX_EMAILS=10

ASYNC_TRIAGE=true
REDIS_REQUIRED=false
REDIS_URL=
```

5. Deploy the Space and verify health endpoint:
- `https://sakshamyadav15-aai.hf.space/api/health`

Notes:
- The Dockerfile writes SQLite DB/session files under `/data` inside container runtime.
- If persistent storage is not enabled on the Space, data can reset on rebuild/restart.

## 6. Deploy Frontend on Vercel

1. Import GitHub repository into Vercel.
2. Set Root Directory to `frontend`.
3. Framework preset: Next.js.
4. Add environment variable:
   - `NEXT_PUBLIC_API_BASE_URL=https://sakshamyadav15-aai.hf.space`
5. Deploy and note frontend URL.

## 7. Final Production Wiring Checklist

1. Backend (HF Space or Render) deployed and reachable.
2. Vercel frontend deployed and reachable.
3. Backend `CLIENT_ORIGIN` points to Vercel domain.
4. Vercel `NEXT_PUBLIC_API_BASE_URL` points to backend domain.
5. Google OAuth redirect URI and JavaScript origins updated with production URLs.
6. Login flow tested end-to-end:
   - Open frontend
   - Sign in with Google
   - Confirm callback returns to frontend
   - Confirm `/api/auth/session` shows authenticated state

## 8. OAuth Callback Error Troubleshooting

If callback returns `{"error":"OAuth callback failed"}`:

1. Verify `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` are from the same Google Cloud project.
2. Confirm redirect URI exactly matches what is configured in Google Cloud Console.
3. Ensure Gmail API is enabled on that project.
4. Ensure `CLIENT_ORIGIN` includes the exact frontend origin.
5. Clear browser cookies for local/dev domains and retry login.
6. Restart backend after changing environment variables.

For HF Spaces specifically:
- Use callback: `https://sakshamyadav15-aai.hf.space/api/auth/callback`
- Set OAuth JavaScript origin to your Vercel frontend domain

## 9. Recommended Production Hardening

1. Use PostgreSQL instead of SQLite for persistent multi-instance behavior.
2. Use Redis for async triage queue in production (`REDIS_URL` + `REDIS_REQUIRED=true`).
3. Rotate session secret and API keys regularly.
4. Enable structured logging and request correlation IDs.
5. Add monitoring and alerting for callback failures and provider rate limits.
