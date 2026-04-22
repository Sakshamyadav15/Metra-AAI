import { z } from "zod";
import { callGroq } from "./groqService.js";

const classificationSchema = z.object({
  category: z.enum(["Urgent", "Routine", "FYI", "Spam"]),
  topic: z.string().min(2),
  summary: z.string().min(8).max(160),
  confidence: z.number().min(0).max(1),
});

function parseJsonResponse(text) {
  const normalized = text
    .replace(/^```json/gi, "")
    .replace(/^```/gi, "")
    .replace(/```$/gi, "")
    .trim();

  // Models occasionally prepend/append plain text; parse the first JSON object if needed.
  try {
    return JSON.parse(normalized);
  } catch {
    const firstBrace = normalized.indexOf("{");
    const lastBrace = normalized.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("No JSON object found in model response");
    }

    const candidate = normalized.slice(firstBrace, lastBrace + 1);
    return JSON.parse(candidate);
  }
}

export async function classifyEmail(email) {
  const content = await callGroq({
    model: process.env.GROQ_CLASSIFY_MODEL || "llama-3.1-8b-instant",
    temperature: 0.1,
    max_tokens: 220,
    messages: [
      {
        role: "system",
        content:
          "You classify inbox emails. Return strict JSON with fields category, topic, summary, confidence. category must be Urgent/Routine/FYI/Spam. summary max 20 words.",
      },
      {
        role: "user",
        content: `From: ${email.from}\nSubject: ${email.subject}\nBody: ${email.body}`,
      },
    ],
  });

  const parsed = parseJsonResponse(content);
  return classificationSchema.parse(parsed);
}

export async function generateDraft(email) {
  const configuredDraftModel =
    process.env.GROQ_DRAFT_MODEL || "llama-3.3-70b-versatile";
  const draftModel =
    configuredDraftModel === "llama-3.1-70b-versatile"
      ? "llama-3.3-70b-versatile"
      : configuredDraftModel;

  const draft = await callGroq({
    model: draftModel,
    temperature: 0.4,
    max_tokens: 260,
    messages: [
      {
        role: "system",
        content:
          "Write a concise professional email reply. Keep it human, polite, and under 120 words. Output plain text only.",
      },
      {
        role: "user",
        content: `Sender: ${email.from}\nOriginal subject: ${email.subject}\nEmail: ${email.body}`,
      },
    ],
  });

  return draft;
}

export const priorityOrder = {
  Urgent: 0,
  Routine: 1,
  FYI: 2,
  Spam: 3,
};
