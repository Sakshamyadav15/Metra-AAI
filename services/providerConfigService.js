import axios from "axios";

function redacted(value) {
  if (!value) {
    return null;
  }
  return `${value.slice(0, 4)}***`;
}

export function getProviderSettings() {
  const provider = (process.env.MODEL_PROVIDER || "groq").toLowerCase();

  return {
    activeProvider: provider,
    providers: {
      groq: {
        configured: Boolean(process.env.GROQ_API_KEY),
        classifyModel: process.env.GROQ_CLASSIFY_MODEL || "llama-3.1-8b-instant",
        draftModel: process.env.GROQ_DRAFT_MODEL || "llama-3.3-70b-versatile",
        keyPreview: redacted(process.env.GROQ_API_KEY || ""),
      },
      openai: {
        configured: Boolean(process.env.OPENAI_API_KEY),
        baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        classifyModel: process.env.OPENAI_CLASSIFY_MODEL || "gpt-4o-mini",
        draftModel: process.env.OPENAI_DRAFT_MODEL || "gpt-4o-mini",
        keyPreview: redacted(process.env.OPENAI_API_KEY || ""),
      },
      azure: {
        configured: Boolean(process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_BASE_URL),
        baseUrl: process.env.AZURE_OPENAI_BASE_URL || "",
        classifyModel: process.env.AZURE_OPENAI_CLASSIFY_MODEL || "gpt-4o-mini",
        draftModel: process.env.AZURE_OPENAI_DRAFT_MODEL || "gpt-4o-mini",
        keyPreview: redacted(process.env.AZURE_OPENAI_API_KEY || ""),
      },
      local: {
        configured: true,
        classifyModel: process.env.LOCAL_CLASSIFY_MODEL || "local-heuristic",
        draftModel: process.env.LOCAL_DRAFT_MODEL || "local-template",
      },
    },
  };
}

async function testGroq() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY missing");
  }

  await axios.get("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    timeout: 15000,
  });
}

async function testOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY missing");
  }

  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  await axios.get(`${baseUrl.replace(/\/$/, "")}/models`, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    timeout: 15000,
  });
}

async function testAzure() {
  if (!process.env.AZURE_OPENAI_API_KEY) {
    throw new Error("AZURE_OPENAI_API_KEY missing");
  }
  if (!process.env.AZURE_OPENAI_BASE_URL) {
    throw new Error("AZURE_OPENAI_BASE_URL missing");
  }

  await axios.post(
    `${process.env.AZURE_OPENAI_BASE_URL.replace(/\/$/, "")}/chat/completions`,
    {
      model: process.env.AZURE_OPENAI_CLASSIFY_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5,
      temperature: 0,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_API_KEY,
      },
      timeout: 15000,
    },
  );
}

export async function testProviderConnectivity(providerName) {
  const provider = (providerName || process.env.MODEL_PROVIDER || "groq").toLowerCase();

  if (provider === "local") {
    return { provider, ok: true, message: "Local provider does not require network connectivity." };
  }

  if (provider === "groq") {
    await testGroq();
    return { provider, ok: true, message: "Groq connectivity test passed." };
  }

  if (provider === "openai") {
    await testOpenAI();
    return { provider, ok: true, message: "OpenAI connectivity test passed." };
  }

  if (provider === "azure") {
    await testAzure();
    return { provider, ok: true, message: "Azure OpenAI compatibility endpoint test passed." };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}
