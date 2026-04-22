import { v4 as uuid } from "uuid";
import { db } from "./db.js";

const insertAuditStmt = db.prepare(`
  INSERT INTO audit_events (
    id, organization_id, user_id, actor, action, entity_type, entity_id,
    model_provider, model_name, confidence, metadata_json, created_at
  ) VALUES (
    @id, @organization_id, @user_id, @actor, @action, @entity_type, @entity_id,
    @model_provider, @model_name, @confidence, @metadata_json, @created_at
  )
`);

const listAuditStmt = db.prepare(`
  SELECT * FROM audit_events
  WHERE user_id = @user_id
  ORDER BY created_at DESC
  LIMIT @limit
`);

export function logAuditEvent({
  organizationId,
  userId,
  actor,
  action,
  entityType,
  entityId,
  modelProvider,
  modelName,
  confidence,
  metadata,
}) {
  insertAuditStmt.run({
    id: uuid(),
    organization_id: organizationId || null,
    user_id: userId || null,
    actor,
    action,
    entity_type: entityType || null,
    entity_id: entityId || null,
    model_provider: modelProvider || null,
    model_name: modelName || null,
    confidence: confidence ?? null,
    metadata_json: metadata ? JSON.stringify(metadata) : null,
    created_at: new Date().toISOString(),
  });
}

export function listAuditEvents(userId, limit = 100) {
  return listAuditStmt.all({ user_id: userId, limit });
}
