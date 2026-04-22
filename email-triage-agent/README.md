# AI Email Triage & Draft Agent

Production-ready v2 starter implementation of the SRS: React + Node.js + Gmail API + pluggable model providers.

## What is included

- Full monorepo scaffold (`client` + `server`) with npm workspaces
- Persistent backend architecture:
  - SQLite persistence for users, triage history, audit events, feedback, processed IDs
  - Persistent session store (`connect-sqlite3`) instead of in-memory sessions
  - Async triage jobs via BullMQ (Redis) with in-memory fallback when Redis is not configured
  - Multi-provider model abstraction (`MODEL_PROVIDER=groq|openai|azure|local`)
- Express backend endpoints:
  - `GET /api/health`
  - `GET /api/auth/google`
  - `GET /api/auth/callback`
  - `GET /api/auth/session`
  - `POST /api/triage`
  - `POST /api/jobs/triage`
  - `GET /api/jobs/:jobId`
  - `GET /api/jobs`
  - `GET /api/jobs/history/latest`
  - `GET /api/providers`
  - `POST /api/providers/test`
  - `POST /api/send`
  - `POST /api/discard`
  - `POST /api/feedback`
  - `GET /api/feedback/profile`
  - `GET /api/feedback/graph`
  - `GET /api/feedback/audit`
- Agent loop behavior:
  - Email fetch
  - Classification (`Urgent | Routine | FYI | Spam`)
  - Draft generation for `Routine`
  - Priority sorting in UI
  - Audit logging of AI and user actions
  - Personalization signal capture (override, edit intensity, feedback)
- React dashboard with editable draft + send/discard actions
- Default `MOCK_MODE=true` so the project runs without external credentials

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template and update values:

```bash
copy .env.example .env
copy client\.env.example client\.env
```

3. Run both apps:

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

Optional (recommended for queue mode):

- Run Redis and set `REDIS_URL` in `.env`.

## Database migration and backup scripts

- Apply versioned SQLite migrations:

```bash
npm run db:migrate
```

- Create a SQLite backup snapshot:

```bash
npm run db:backup
```

- Optional Postgres connectivity check:

```bash
npm run db:pg:check
```

Postgres is an optional target path. A compatible bootstrap schema is included at `server/postgres/001_init.sql`.

## Switching to live Gmail + Groq mode

Update root `.env`:

- `MOCK_MODE=false`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI` (default callback is already configured)
- `GROQ_API_KEY`
- `SESSION_SECRET`
- `MODEL_PROVIDER=groq`

Then restart:

```bash
npm run dev
```

## Notes

- In mock mode, triage and send/discard are simulated.
- In live mode, OAuth is required and Gmail send marks threads as read.
- `POST /api/triage` supports async wait mode. Existing UI still works by calling it with wait enabled.
- `GET /api/providers` and `POST /api/providers/test` support provider settings UI and connectivity tests.
- Queue behavior policy:
  - `ASYNC_TRIAGE=true` and missing `REDIS_URL` falls back to in-memory jobs for local development.
  - `REDIS_REQUIRED=true` blocks fallback and fails fast.
  - In production (`NODE_ENV=production`), Redis-required mode is automatically enforced.
