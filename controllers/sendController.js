import { isMockMode } from "../services/authHelpers.js";
import { markThreadRead, sendReply } from "../services/gmailService.js";
import { getRequestTokens } from "../services/userContext.js";
import { logAuditEvent } from "../services/auditService.js";

export async function postSend(req, res) {
  const { to, subject, draft, threadId } = req.body || {};
  if (!to || !subject || !draft || !threadId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    if (isMockMode()) {
      logAuditEvent({
        organizationId: req.user.organization_id,
        userId: req.user.id,
        actor: "user",
        action: "email_send_mock",
        entityType: "thread",
        entityId: threadId,
      });
      return res.json({ ok: true, mock: true });
    }

    const tokens = getRequestTokens(req);
    if (!tokens) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await sendReply(tokens, {
      to,
      subject,
      body: draft,
      threadId,
    });
    await markThreadRead(tokens, threadId);

    logAuditEvent({
      organizationId: req.user.organization_id,
      userId: req.user.id,
      actor: "user",
      action: "email_sent",
      entityType: "thread",
      entityId: threadId,
      metadata: { to, subjectLength: subject.length },
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error("send_failed", error?.response?.data || error.message);
    return res.status(500).json({ error: "Failed to send email" });
  }
}

export function postDiscard(_req, res) {
  logAuditEvent({
    organizationId: _req.user.organization_id,
    userId: _req.user.id,
    actor: "user",
    action: "draft_discarded",
    entityType: "triage_item",
    entityId: _req.body?.id || null,
  });
  return res.json({ ok: true });
}
