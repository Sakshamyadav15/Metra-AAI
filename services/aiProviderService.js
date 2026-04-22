import axios from "axios";
import { z } from "zod";
import { callGroq } from "./groqService.js";

const classificationSchema = z.object({
  category: z.enum(["Urgent", "Routine", "FYI", "Spam"]),
  topic: z.string().min(2),
  summary: z.string().min(8).max(160),
  confidence: z.number().min(0).max(1),
});

function parseJsonResponse(text) {
  const normalized = (text || "")
    .replace(/^```json/gi, "")
    .replace(/^```/gi, "")
    .replace(/```$/gi, "")
    .trim();

  try {
    return JSON.parse(normalized);
  } catch {
    const firstBrace = normalized.indexOf("{");
    const lastBrace = normalized.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("No JSON object found in model response");
    }
    return JSON.parse(normalized.slice(firstBrace, lastBrace + 1));
  }
}

function buildPersonalizationNote(context) {
  if (!context) {
    return "";
  }

  const senderHints = (context.topSenders || [])
    .slice(0, 4)
    .map((sender) => `${sender.sender_email}=>importance:${Number(sender.importance_score).toFixed(2)}`)
    .join("; ");

  const overrideHints = (context.topOverrides || [])
    .slice(0, 4)
    .map((row) => `${row.user_category}:${row.total}`)
    .join("; ");

  return `User personalization hints\nTop senders: ${senderHints || "none"}\nCategory override trend: ${overrideHints || "none"}`;
}

async function callOpenAICompatible({ baseUrl, key, model, messages, temperature, max_tokens, apiKeyHeader = "Authorization" }) {
  const headers = { "Content-Type": "application/json" };
  if (apiKeyHeader === "Authorization") {
    headers.Authorization = `Bearer ${key}`;
  } else {
    headers[apiKeyHeader] = key;
  }

  const response = await axios.post(
    `${baseUrl.replace(/\/$/, "")}/chat/completions`,
    { model, messages, temperature, max_tokens },
    { headers, timeout: 30000 },
  );

  return response.data?.choices?.[0]?.message?.content?.trim() || "";
}

function getProvider() {
  return (process.env.MODEL_PROVIDER || "groq").toLowerCase();
}

function getClassifyModel(provider) {
  if (provider === "openai") return process.env.OPENAI_CLASSIFY_MODEL || "gpt-4o-mini";
  if (provider === "azure") return process.env.AZURE_OPENAI_CLASSIFY_MODEL || "gpt-4o-mini";
  if (provider === "local") return process.env.LOCAL_CLASSIFY_MODEL || "local-heuristic";
  return process.env.GROQ_CLASSIFY_MODEL || "llama-3.1-8b-instant";
}

function getDraftModel(provider) {
  if (provider === "openai") return process.env.OPENAI_DRAFT_MODEL || "gpt-4o-mini";
  if (provider === "azure") return process.env.AZURE_OPENAI_DRAFT_MODEL || "gpt-4o-mini";
  if (provider === "local") return process.env.LOCAL_DRAFT_MODEL || "local-template";

  const configured = process.env.GROQ_DRAFT_MODEL || "llama-3.3-70b-versatile";
  if (configured === "llama-3.1-70b-versatile") {
    return "llama-3.3-70b-versatile";
  }
  return configured;
}

async function executeProvider({ provider, model, messages, temperature, max_tokens }) {
  if (provider === "groq") {
    return callGroq({ model, messages, temperature, max_tokens });
  }

  if (provider === "openai") {
    return callOpenAICompatible({
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      key: process.env.OPENAI_API_KEY,
      model,
      messages,
      temperature,
      max_tokens,
    });
  }

  if (provider === "azure") {
    return callOpenAICompatible({
      baseUrl: process.env.AZURE_OPENAI_BASE_URL || "",
      key: process.env.AZURE_OPENAI_API_KEY,
      model,
      messages,
      temperature,
      max_tokens,
      apiKeyHeader: "api-key",
    });
  }

  if (provider === "local") {
    const userPrompt = messages[messages.length - 1]?.content || "";
    if (userPrompt.toLowerCase().includes("subject:")) {
      return JSON.stringify({
        category: "FYI",
        topic: "Other",
        summary: "Locally classified fallback result.",
        confidence: 0.55,
      });
    }

    return "Thanks for your email. I will review this and respond soon.";
  }

  throw new Error(`Unsupported MODEL_PROVIDER: ${provider}`);
}

export async function classifyEmail(email, personalizationContext) {
  const provider = getProvider();
  const model = getClassifyModel(provider);
  const personalizationNote = buildPersonalizationNote(personalizationContext);

  const content = await executeProvider({
    provider,
    model,
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
        content: `${personalizationNote}\nFrom: ${email.from}\nSubject: ${email.subject}\nBody: ${email.body}`,
      },
    ],
  });

  const parsed = classificationSchema.parse(parseJsonResponse(content));
  return {
    ...parsed,
    modelProvider: provider,
    classifyModel: model,
  };
}

export async function generateDraft(email, personalizationContext) {
  const provider = getProvider();
  const model = getDraftModel(provider);
  const personalizationNote = buildPersonalizationNote(personalizationContext);

  const draft = await executeProvider({
    provider,
    model,
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
        content: `${personalizationNote}\nSender: ${email.from}\nOriginal subject: ${email.subject}\nEmail: ${email.body}`,
      },
    ],
  });

  return {
    draft,
    modelProvider: provider,
    draftModel: model,
  };
}

export const priorityOrder = {
  Urgent: 0,
  Routine: 1,
  FYI: 2,
  Spam: 3,
};
