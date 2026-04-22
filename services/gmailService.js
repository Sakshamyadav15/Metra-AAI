import { google } from "googleapis";
import { createOAuthClient } from "./authHelpers.js";

function decodeBase64Url(content = "") {
  const normalized = content.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function stripHtml(input = "") {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractBody(payload) {
  if (!payload) {
    return "";
  }

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts?.length) {
    for (const part of payload.parts) {
      const body = extractBody(part);
      if (body) {
        return body;
      }
    }
  }

  return "";
}

function normalizeEmail(message) {
  const headers = message.payload?.headers || [];
  const getHeader = (name) =>
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";

  const from = getHeader("From");
  const subject = getHeader("Subject") || "(no subject)";
  const date = getHeader("Date") || new Date().toISOString();
  const rawBody = extractBody(message.payload);
  const cleanBody = stripHtml(rawBody).slice(0, 1500);

  return {
    id: message.id,
    threadId: message.threadId,
    from,
    subject,
    date,
    snippet: (message.snippet || "").trim(),
    body: cleanBody,
  };
}

function getGmailClient(tokens) {
  const auth = createOAuthClient();
  auth.setCredentials(tokens);
  return google.gmail({ version: "v1", auth });
}

export async function fetchUnreadEmails(tokens, maxResults = 50) {
  const gmail = getGmailClient(tokens);
  const listResponse = await gmail.users.messages.list({
    userId: "me",
    q: "is:unread",
    maxResults,
  });

  const messages = listResponse.data.messages || [];
  const detailed = await Promise.all(
    messages.map((msg) =>
      gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      }),
    ),
  );

  return detailed.map((item) => normalizeEmail(item.data));
}

function toBase64Url(raw) {
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendReply(tokens, { to, subject, body, threadId }) {
  const gmail = getGmailClient(tokens);
  const encodedSubject = subject.startsWith("Re:") ? subject : `Re: ${subject}`;
  const raw = [`To: ${to}`, "Content-Type: text/plain; charset=utf-8", `Subject: ${encodedSubject}`, "", body].join("\n");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: toBase64Url(raw),
      threadId,
    },
  });
}

export async function markThreadRead(tokens, threadId) {
  const gmail = getGmailClient(tokens);
  await gmail.users.threads.modify({
    userId: "me",
    id: threadId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });
}
