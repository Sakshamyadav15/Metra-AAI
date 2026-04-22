import { google } from "googleapis";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
];

export function hasGoogleOAuthConfig() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI,
  );
}

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
}

export function getAuthUrl(state = "triage") {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    state,
  });
}

export async function exchangeCodeForTokens(code) {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function fetchGoogleUserIdentity(tokens) {
  const client = createOAuthClient();
  client.setCredentials(tokens);

  try {
    // Gmail profile works with the scopes already required for this app.
    const gmail = google.gmail({ version: "v1", auth: client });
    const { data } = await gmail.users.getProfile({ userId: "me" });
    const email = data.emailAddress;

    if (!email) {
      throw new Error("Missing email address in Gmail profile response");
    }

    return {
      email,
      displayName: email.split("@")[0],
    };
  } catch (_gmailError) {
    // Fallback for environments where userinfo is available.
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data } = await oauth2.userinfo.get();

    return {
      email: data.email,
      displayName: data.name || data.email,
    };
  }
}

export function isMockMode() {
  return process.env.MOCK_MODE !== "false";
}
