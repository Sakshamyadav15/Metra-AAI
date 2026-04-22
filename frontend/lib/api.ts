declare const process: { env: Record<string, string | undefined> }

const apiRoot = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const trimmedRoot = apiRoot.replace(/\/$/, "");
export const apiBaseUrl = `${trimmedRoot}/api`;

type JsonBody = Record<string, unknown> | Array<unknown> | null | undefined;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const errorData = (await response.json()) as { error?: string };
      if (errorData?.error) {
        message = errorData.error;
      }
    } catch {
      // Keep fallback status message when response is not JSON.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

export function apiPost<T>(path: string, body?: JsonBody): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}
