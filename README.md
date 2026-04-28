# Metra AAI - Email Inbox Automation

Metra AAI is an AI-powered inbox automation platform that connects to Gmail, intelligently classifies incoming emails, generates context-aware draft responses, and maintains comprehensive audit trails for enterprise reliability.

**GitHub:** [Sakshamyadav15/Metra-AAI](https://github.com/Sakshamyadav15/Metra-AAI)  
**Live:** [Hugging Face Spaces](https://huggingface.co/spaces/Sakshamyadav15/AAI) + [Vercel](https://metra-aai.vercel.app)

---

## ✨ Features

- **Gmail Integration** - OAuth 2.0 authentication with direct Gmail API access
- **Intelligent Triage** - AI-powered email classification using Groq LLMs
- **Smart Drafts** - Context-aware reply generation powered by advanced language models
- **Audit Trail** - Complete operational history and activity logging
- **Responsive UI** - Modern Next.js frontend with email selection and draft editing
- **Scalable Backend** - Express.js API with async job processing
- **Multi-Model Support** - Configurable LLM providers (Groq, easily extensible)

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15.5.6 with App Router
- React + TypeScript
- Zustand for state management
- Tailwind CSS + custom animations
- Lucide React for icons

**Backend:**
- Node.js 20 + Express
- Groq API (llama-3.1-8b-instant, llama-3.3-70b-versatile)
- SQLite (dev) / PostgreSQL (production)
- OAuth 2.0 (Google Gmail API)
- Docker ready (Hugging Face Spaces)

**Deployment:**
- **Frontend:** Vercel
- **Backend:** Hugging Face Spaces (Docker) or Render
- **Database:** SQLite (local), PostgreSQL (production)
- **Queue:** In-memory (dev) / Redis (production)

---

## 📁 Repository Layout

```
Metra-AAI/
├── frontend/                           # Next.js frontend app
│   ├── app/                           # App router and pages
│   ├── components/                    # React components
│   ├── lib/store/                     # Zustand store slices
│   └── ...
├── email-triage-agent/
│   ├── server/                        # Express backend API
│   │   ├── services/                 # Business logic (auth, triage, email)
│   │   ├── routes/                   # API endpoints
│   │   ├── middleware/               # Express middleware
│   │   └── index.js                  # Entry point
│   └── .env                          # Backend environment variables
├── Dockerfile                         # Hugging Face Spaces Docker build
├── .dockerignore                      # Docker context filtering
├── render.yaml                        # Render Blueprint configuration
├── .gitignore                         # Git ignore rules
└── README.md                          # This file
```

### Directory Details

- **`frontend/`**: Vercel-deployable Next.js application with email dashboard, draft editor, and OAuth integration
- **`email-triage-agent/server/`**: Express.js API backend handling Gmail OAuth, email triage, draft generation, and session management
- **`Dockerfile`**: Container runtime for Hugging Face Spaces (backend only)
- **`render.yaml`**: IaC Blueprint for automated Render deployment
- **`.gitignore`**: Excludes node_modules, .env files, archives, and local artifacts

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Google Cloud project with Gmail API enabled
- (For deployment) Hugging Face, Vercel, and/or Render accounts

### Local Development

#### 1. Clone and Install

```bash
git clone https://github.com/Sakshamyadav15/Metra-AAI.git
cd Metra-AAI

# Install frontend dependencies
npm install --prefix frontend

# Install backend dependencies
npm install --prefix email-triage-agent/server
```

#### 2. Set Up Environment Variables

**Backend** (`email-triage-agent/.env`):**Backend** (`email-triage-agent/.env`):

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

# Security
SESSION_SECRET=your-secure-random-string-here

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/callback

# AI Models
MODEL_PROVIDER=groq
GROQ_API_KEY=your-groq-api-key-here
GROQ_CLASSIFY_MODEL=llama-3.1-8b-instant
GROQ_DRAFT_MODEL=llama-3.3-70b-versatile

# Email Configuration
TRIAGE_MAX_EMAILS=10
ASYNC_TRIAGE=true
MOCK_MODE=false

# Redis (optional for production)
REDIS_REQUIRED=false
REDIS_URL=
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

#### 3. Run Locally

**Terminal 1 - Backend:**

```bash
npm run dev --prefix email-triage-agent/server
# Runs on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

**Terminal 2 - Frontend:**

```bash
npm run dev --prefix frontend
# Runs on http://localhost:3000
```

Visit `http://localhost:3000` and sign in with a Google account to test the full flow.

---

## Environment Variables Reference

### Frontend (`frontend/.env.local`)

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
