import { v4 as uuid } from "uuid";
import { db } from "./db.js";

const upsertOrganizationStmt = db.prepare(`
  INSERT INTO organizations (id, name)
  VALUES (@id, @name)
  ON CONFLICT(id) DO UPDATE SET name = excluded.name
`);

const upsertUserStmt = db.prepare(`
  INSERT INTO users (id, organization_id, email, display_name, last_login_at)
  VALUES (@id, @organization_id, @email, @display_name, @last_login_at)
  ON CONFLICT(email) DO UPDATE SET
    display_name = excluded.display_name,
    last_login_at = excluded.last_login_at
`);

const findUserByEmailStmt = db.prepare(`SELECT * FROM users WHERE email = ?`);
const findUserByIdStmt = db.prepare(`SELECT * FROM users WHERE id = ?`);

const upsertTokensStmt = db.prepare(`
  INSERT INTO oauth_tokens (user_id, access_token, refresh_token, scope, token_type, expiry_date, updated_at)
  VALUES (@user_id, @access_token, @refresh_token, @scope, @token_type, @expiry_date, @updated_at)
  ON CONFLICT(user_id) DO UPDATE SET
    access_token = excluded.access_token,
    refresh_token = COALESCE(excluded.refresh_token, oauth_tokens.refresh_token),
    scope = excluded.scope,
    token_type = excluded.token_type,
    expiry_date = excluded.expiry_date,
    updated_at = excluded.updated_at
`);

const getTokensStmt = db.prepare(`SELECT * FROM oauth_tokens WHERE user_id = ?`);

const saveRunStmt = db.prepare(`
  INSERT INTO triage_runs (id, user_id, status, total_emails, processed_emails, error_message, started_at, finished_at)
  VALUES (@id, @user_id, @status, @total_emails, @processed_emails, @error_message, @started_at, @finished_at)
  ON CONFLICT(id) DO UPDATE SET
    status = excluded.status,
    total_emails = excluded.total_emails,
    processed_emails = excluded.processed_emails,
    error_message = excluded.error_message,
    finished_at = excluded.finished_at
`);

const insertItemStmt = db.prepare(`
  INSERT INTO triage_items (
    id, run_id, user_id, gmail_message_id, thread_id, sender_email, subject, snippet, body,
    category, topic, summary, confidence, draft_text, model_provider, classify_model, draft_model
  ) VALUES (
    @id, @run_id, @user_id, @gmail_message_id, @thread_id, @sender_email, @subject, @snippet, @body,
    @category, @topic, @summary, @confidence, @draft_text, @model_provider, @classify_model, @draft_model
  )
`);

const markProcessedStmt = db.prepare(`
  INSERT INTO processed_emails (user_id, gmail_message_id, thread_id)
  VALUES (?, ?, ?)
  ON CONFLICT(user_id, gmail_message_id) DO NOTHING
`);

const listProcessedIdsStmt = db.prepare(`
  SELECT gmail_message_id FROM processed_emails WHERE user_id = ?
`);

const listRunItemsStmt = db.prepare(`
  SELECT * FROM triage_items WHERE run_id = ? ORDER BY created_at DESC
`);

const latestItemsStmt = db.prepare(`
  SELECT * FROM triage_items WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
`);

const listRunsStmt = db.prepare(`
  SELECT * FROM triage_runs WHERE user_id = ? ORDER BY started_at DESC LIMIT ?
`);

const updateSenderProfileStmt = db.prepare(`
  INSERT INTO sender_profiles (
    user_id, sender_email, importance_score, total_messages, total_overrides, last_category, last_interaction_at
  ) VALUES (
    @user_id, @sender_email, @importance_score, @total_messages, @total_overrides, @last_category, @last_interaction_at
  )
  ON CONFLICT(user_id, sender_email) DO UPDATE SET
    importance_score = excluded.importance_score,
    total_messages = excluded.total_messages,
    total_overrides = excluded.total_overrides,
    last_category = excluded.last_category,
    last_interaction_at = excluded.last_interaction_at
`);

const getSenderProfileStmt = db.prepare(`
  SELECT * FROM sender_profiles WHERE user_id = ? AND sender_email = ?
`);

const listTopSenderProfilesStmt = db.prepare(`
  SELECT * FROM sender_profiles WHERE user_id = ? ORDER BY importance_score DESC, total_messages DESC LIMIT ?
`);

export function ensureDefaultMockUser() {
  const email = process.env.MOCK_USER_EMAIL || "local.user@example.com";
  const existing = findUserByEmailStmt.get(email);
  if (existing) {
    return existing;
  }

  const organizationId = uuid();
  const userId = uuid();
  upsertOrganizationStmt.run({ id: organizationId, name: "Local Workspace" });
  upsertUserStmt.run({
    id: userId,
    organization_id: organizationId,
    email,
    display_name: "Local User",
    last_login_at: new Date().toISOString(),
  });
  return findUserByIdStmt.get(userId);
}

export function upsertUserIdentity({ email, displayName }) {
  const existing = findUserByEmailStmt.get(email);
  const organizationId = existing?.organization_id || uuid();
  const userId = existing?.id || uuid();

  if (!existing) {
    upsertOrganizationStmt.run({
      id: organizationId,
      name: `${displayName || email} Workspace`,
    });
  }

  upsertUserStmt.run({
    id: userId,
    organization_id: organizationId,
    email,
    display_name: displayName || email,
    last_login_at: new Date().toISOString(),
  });

  return findUserByIdStmt.get(userId);
}

export function saveOAuthTokens(userId, tokens) {
  upsertTokensStmt.run({
    user_id: userId,
    access_token: tokens.access_token || null,
    refresh_token: tokens.refresh_token || null,
    scope: tokens.scope || null,
    token_type: tokens.token_type || null,
    expiry_date: tokens.expiry_date || null,
    updated_at: new Date().toISOString(),
  });
}

export function getOAuthTokens(userId) {
  return getTokensStmt.get(userId) || null;
}

export function saveTriageRun(run) {
  saveRunStmt.run({
    id: run.id,
    user_id: run.userId,
    status: run.status,
    total_emails: run.totalEmails || 0,
    processed_emails: run.processedEmails || 0,
    error_message: run.errorMessage || null,
    started_at: run.startedAt || new Date().toISOString(),
    finished_at: run.finishedAt || null,
  });
}

export function saveTriageItems(runId, userId, items) {
  const transaction = db.transaction((rows) => {
    for (const item of rows) {
      const itemId = item.id || uuid();
      insertItemStmt.run({
        id: itemId,
        run_id: runId,
        user_id: userId,
        gmail_message_id: item.gmailMessageId || item.id,
        thread_id: item.threadId,
        sender_email: item.from,
        subject: item.subject,
        snippet: item.snippet,
        body: item.body,
        category: item.category,
        topic: item.topic,
        summary: item.summary,
        confidence: item.confidence,
        draft_text: item.draft || "",
        model_provider: item.modelProvider || null,
        classify_model: item.classifyModel || null,
        draft_model: item.draftModel || null,
      });

      markProcessedStmt.run(userId, item.gmailMessageId || item.id, item.threadId || null);

      const sender = item.from || "unknown@unknown";
      const existingProfile = getSenderProfileStmt.get(userId, sender);
      const totalMessages = (existingProfile?.total_messages || 0) + 1;
      const overrides = existingProfile?.total_overrides || 0;
      const base = existingProfile?.importance_score ?? 0.5;
      const importanceScore = Math.min(0.99, base * 0.92 + 0.08 * (item.category === "Urgent" ? 1 : 0.4));

      updateSenderProfileStmt.run({
        user_id: userId,
        sender_email: sender,
        importance_score: importanceScore,
        total_messages: totalMessages,
        total_overrides: overrides,
        last_category: item.category,
        last_interaction_at: new Date().toISOString(),
      });
    }
  });

  transaction(items);
}

export function getProcessedEmailIds(userId) {
  return new Set(listProcessedIdsStmt.all(userId).map((row) => row.gmail_message_id));
}

export function getRunItems(runId) {
  return listRunItemsStmt.all(runId);
}

export function getLatestItems(userId, limit = 50) {
  return latestItemsStmt.all(userId, limit);
}

export function getRecentRuns(userId, limit = 20) {
  return listRunsStmt.all(userId, limit);
}

export function getTopSenders(userId, limit = 10) {
  return listTopSenderProfilesStmt.all(userId, limit);
}

export function getUserById(userId) {
  return findUserByIdStmt.get(userId) || null;
}
