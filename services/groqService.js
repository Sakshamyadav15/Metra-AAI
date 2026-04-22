import axios from "axios";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(error, attempt) {
  const retryAfterHeader = error?.response?.headers?.["retry-after"];
  if (retryAfterHeader) {
    const seconds = Number(retryAfterHeader);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }
  }

  const providerMessage = error?.response?.data?.error?.message || "";
  const match = providerMessage.match(/try again in\s*([0-9.]+)s/i);
  if (match) {
    const seconds = Number(match[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds * 1000);
    }
  }

  const exponential = 700 * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * 300);
  return exponential + jitter;
}

export async function callGroq({ model, messages, temperature = 0.2, max_tokens = 350 }) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    throw new Error("GROQ_API_KEY is missing");
  }

  let attempt = 0;
  const maxAttempts = 5;

  while (attempt < maxAttempts) {
    try {
      const response = await axios.post(
        GROQ_BASE_URL,
        {
          model,
          messages,
          temperature,
          max_tokens,
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          timeout: 25000,
        },
      );

      return response.data?.choices?.[0]?.message?.content?.trim() || "";
    } catch (error) {
      const status = error?.response?.status;
      attempt += 1;

      if (status === 429 && attempt < maxAttempts) {
        const backoffMs = getRetryDelayMs(error, attempt);
        await sleep(backoffMs);
        continue;
      }

      throw error;
    }
  }

  throw new Error("Groq call failed after retries");
}
