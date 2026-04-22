import { saveFeedback, getPersonalizationContext } from "../services/personalizationService.js";
import { listAuditEvents, logAuditEvent } from "../services/auditService.js";
import { getTopSenders } from "../services/persistenceService.js";

export function postFeedback(req, res) {
  const { triageItemId, action, aiCategory, userCategory, draftEditRatio, notes } = req.body || {};

  if (!triageItemId || !action) {
    return res.status(400).json({ error: "triageItemId and action are required" });
  }

  saveFeedback({
    userId: req.user.id,
    triageItemId,
    action,
    aiCategory,
    userCategory,
    draftEditRatio,
    notes,
  });

  logAuditEvent({
    organizationId: req.user.organization_id,
    userId: req.user.id,
    actor: "user",
    action: "feedback_submitted",
    entityType: "triage_item",
    entityId: triageItemId,
    metadata: { action, aiCategory, userCategory, draftEditRatio },
  });

  return res.json({ ok: true });
}

export function getPersonalizationProfile(req, res) {
  const context = getPersonalizationContext(req.user.id);
  return res.json(context);
}

export function getSenderGraph(req, res) {
  const senders = getTopSenders(req.user.id, 50);
  const nodes = senders.map((sender) => ({
    id: sender.sender_email,
    type: "sender",
    label: sender.sender_email,
    importance: sender.importance_score,
    totalMessages: sender.total_messages,
  }));

  const edges = senders
    .filter((sender) => sender.last_category)
    .map((sender) => ({
      source: sender.sender_email,
      target: sender.last_category,
      weight: sender.total_messages,
      relation: "recent-category",
    }));

  return res.json({ nodes, edges });
}

export function getAuditTrail(req, res) {
  const limit = Number(req.query.limit || 200);
  const events = listAuditEvents(req.user.id, limit);
  return res.json({ events });
}
