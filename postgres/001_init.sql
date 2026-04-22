-- Optional Postgres target schema bootstrap (v2)
-- This file is provided as an optional target baseline while runtime remains SQLite-first.

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  access_token TEXT,
  refresh_token TEXT,
  scope TEXT,
  token_type TEXT,
  expiry_date BIGINT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS processed_emails (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  gmail_message_id TEXT NOT NULL,
  thread_id TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, gmail_message_id)
);

CREATE TABLE IF NOT EXISTS triage_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  total_emails INTEGER NOT NULL DEFAULT 0,
  processed_emails INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS triage_items (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES triage_runs(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  gmail_message_id TEXT NOT NULL,
  thread_id TEXT,
  sender_email TEXT,
  subject TEXT,
  snippet TEXT,
  body TEXT,
  category TEXT,
  topic TEXT,
  summary TEXT,
  confidence DOUBLE PRECISION,
  draft_text TEXT,
  model_provider TEXT,
  classify_model TEXT,
  draft_model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  triage_item_id TEXT NOT NULL REFERENCES triage_items(id),
  action TEXT NOT NULL,
  ai_category TEXT,
  user_category TEXT,
  draft_edit_ratio DOUBLE PRECISION,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sender_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  sender_email TEXT NOT NULL,
  importance_score DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  total_messages INTEGER NOT NULL DEFAULT 0,
  total_overrides INTEGER NOT NULL DEFAULT 0,
  last_category TEXT,
  last_interaction_at TIMESTAMPTZ,
  UNIQUE(user_id, sender_email)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id),
  user_id TEXT REFERENCES users(id),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  model_provider TEXT,
  model_name TEXT,
  confidence DOUBLE PRECISION,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_triage_items_user_created ON triage_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_user_created ON audit_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user_created ON feedback_events(user_id, created_at DESC);
