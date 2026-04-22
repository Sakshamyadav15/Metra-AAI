import { ensureDefaultMockUser, getOAuthTokens, getUserById } from "./persistenceService.js";
import { isMockMode } from "./authHelpers.js";

export function hydrateMockUserSession(req, _res, next) {
  if (!isMockMode()) {
    return next();
  }

  if (!req.session.userId) {
    const user = ensureDefaultMockUser();
    req.session.userId = user.id;
  }

  return next();
}

export function getRequestUser(req) {
  if (!req.session?.userId) {
    return null;
  }
  return getUserById(req.session.userId);
}

export function getRequestTokens(req) {
  if (isMockMode()) {
    return null;
  }
  if (!req.session?.userId) {
    return null;
  }

  const tokenRow = getOAuthTokens(req.session.userId);
  if (!tokenRow) {
    return null;
  }

  return {
    access_token: tokenRow.access_token,
    refresh_token: tokenRow.refresh_token,
    scope: tokenRow.scope,
    token_type: tokenRow.token_type,
    expiry_date: tokenRow.expiry_date,
  };
}

export function requireUser(req, res, next) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = user;
  return next();
}
