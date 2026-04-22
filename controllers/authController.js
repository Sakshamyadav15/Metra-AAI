import {
  exchangeCodeForTokens,
  fetchGoogleUserIdentity,
  getAuthUrl,
  hasGoogleOAuthConfig,
  isMockMode,
} from "../services/authHelpers.js";
import {
  ensureDefaultMockUser,
  getUserById,
  saveOAuthTokens,
  upsertUserIdentity,
} from "../services/persistenceService.js";
import { logAuditEvent } from "../services/auditService.js";

export function getGoogleAuth(_req, res) {
  if (isMockMode()) {
    const user = ensureDefaultMockUser();
    _req.session.userId = user.id;
    return res.json({
      message: "Mock mode enabled. OAuth is not required.",
      mock: true,
    });
  }

  if (!hasGoogleOAuthConfig()) {
    return res.status(501).json({
      error: "Google OAuth is not configured. Fill .env values first.",
    });
  }

  const url = getAuthUrl("email-triage");
  return res.redirect(url);
}

export async function getGoogleCallback(req, res) {
  if (isMockMode()) {
    const user = ensureDefaultMockUser();
    req.session.userId = user.id;
    return res.redirect(`${process.env.CLIENT_ORIGIN || "http://localhost:3000"}?auth=mock`);
  }

  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: "Missing OAuth code" });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const identity = await fetchGoogleUserIdentity(tokens);
    const user = upsertUserIdentity(identity);

    saveOAuthTokens(user.id, tokens);
    req.session.userId = user.id;

    logAuditEvent({
      organizationId: user.organization_id,
      userId: user.id,
      actor: "user",
      action: "oauth_login",
      entityType: "session",
      entityId: req.sessionID,
    });

    return res.redirect(`${process.env.CLIENT_ORIGIN || "http://localhost:3000"}?auth=ok`);
  } catch (error) {
    console.error("OAuth callback failed", error?.response?.data || error.message);
    return res.status(500).json({ error: "OAuth callback failed" });
  }
}

export function getSessionStatus(req, res) {
  const authenticated = Boolean(req.session?.userId) || isMockMode();
  const user = req.session?.userId ? getUserById(req.session.userId) : null;
  return res.json({
    authenticated,
    mock: isMockMode(),
    userId: req.session?.userId || null,
    user: user
      ? {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
        }
      : null,
  });
}
