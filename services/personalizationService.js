import { v4 as uuid } from "uuid";
import { db } from "./db.js";
import { getTopSenders } from "./persistenceService.js";

const insertFeedbackStmt = db.prepare(`
  INSERT INTO feedback_events (
    id, user_id, triage_item_id, action, ai_category, user_category, draft_edit_ratio, notes, created_at
  ) VALUES (
    @id, @user_id, @triage_item_id, @action, @ai_category, @user_category, @draft_edit_ratio, @notes, @created_at
  )
`);

const listFeedbackStmt = db.prepare(`
  SELECT * FROM feedback_events WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
`);

const getItemStmt = db.prepare(`
  SELECT * FROM triage_items WHERE id = ?
`);

const getOverrideCountsStmt = db.prepare(`
  SELECT user_category, COUNT(*) as total
  FROM feedback_events
  WHERE user_id = @user_id AND action = 'override_category'
  GROUP BY user_category
  ORDER BY total DESC
  LIMIT 5
`);

const updateSenderProfileStmt = db.prepare(`
  UPDATE sender_profiles
  SET total_overrides = total_overrides + 1,
      importance_score = MIN(0.99, importance_score + 0.08)
  WHERE user_id = @user_id AND sender_email = @sender_email
`);

export function saveFeedback({ userId, triageItemId, action, aiCategory, userCategory, draftEditRatio, notes }) {
  insertFeedbackStmt.run({
    id: uuid(),
    user_id: userId,
    triage_item_id: triageItemId,
    action,
    ai_category: aiCategory || null,
    user_category: userCategory || null,
    draft_edit_ratio: draftEditRatio ?? null,
    notes: notes || null,
    created_at: new Date().toISOString(),
  });

  if (action === "override_category") {
    const item = getItemStmt.get(triageItemId);
    if (item?.sender_email) {
      updateSenderProfileStmt.run({ user_id: userId, sender_email: item.sender_email });
    }
  }
}

export function getPersonalizationContext(userId) {
  const topOverrides = getOverrideCountsStmt.all({ user_id: userId });
  const recentFeedback = listFeedbackStmt.all(userId, 20);
  const topSenders = getTopSenders(userId, 8);

  return {
    topOverrides,
    topSenders,
    recentFeedback,
  };
}
