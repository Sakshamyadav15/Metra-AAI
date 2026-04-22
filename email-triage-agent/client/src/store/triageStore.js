import { create } from "zustand";
import { api } from "../api/client";

function normalizeEmail(item) {
  const id = item.id || item.gmail_message_id || item.gmailMessageId;
  const draft = item.draft ?? item.draft_text ?? "";

  return {
    id,
    gmailMessageId: item.gmailMessageId || item.gmail_message_id || id,
    threadId: item.threadId || item.thread_id,
    from: item.from || item.sender_email,
    subject: item.subject,
    snippet: item.snippet,
    body: item.body,
    category: item.category,
    topic: item.topic,
    summary: item.summary,
    confidence: item.confidence,
    draft,
    originalDraft: draft,
  };
}

function estimateDraftEditRatio(originalDraft, editedDraft) {
  const source = originalDraft || "";
  const edited = editedDraft || "";
  const base = Math.max(source.length, 1);
  return Math.min(1, Math.abs(edited.length - source.length) / base);
}

export const useTriageStore = create((set, get) => ({
  emails: [],
  loading: false,
  error: "",
  session: { authenticated: false, mock: false },
  activeJobId: "",

  waitForJob: async (jobId, timeoutMs = 30000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const { data } = await api.get(`/jobs/${jobId}`);
      const status = data.status;

      if (status === "completed") {
        return data.result?.emails || [];
      }

      if (status === "failed") {
        throw new Error(data.error || "Triage job failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("Triage is still processing. Check jobs shortly.");
  },

  fetchSession: async () => {
    try {
      const { data } = await api.get("/auth/session");
      set({ session: data });
    } catch {
      set({ session: { authenticated: false, mock: false } });
    }
  },

  loadLatestHistory: async () => {
    try {
      const { data } = await api.get("/jobs/history/latest");
      const emails = (data?.emails || []).map(normalizeEmail);
      set({ emails });
    } catch {
      // Keep silent: this endpoint is optional for first-time users.
    }
  },

  runTriage: async () => {
    set({ loading: true, error: "" });
    try {
      const { data } = await api.post("/jobs/triage", {});
      const jobId = data.jobId || "";
      set({ activeJobId: jobId });
      const emails = await get().waitForJob(jobId);
      set({
        emails: (emails || []).map(normalizeEmail),
        loading: false,
      });
    } catch (error) {
      set({
        loading: false,
        error: error?.response?.data?.error || "Unable to fetch triage data",
      });
    }
  },

  updateDraft: (id, draft) => {
    const next = get().emails.map((email) =>
      email.id === id ? { ...email, draft } : email,
    );
    set({ emails: next });
  },

  discardDraft: async (id) => {
    await api.post("/discard", { id });
    await api.post("/feedback", {
      triageItemId: id,
      action: "discard_draft",
    });
    set({ emails: get().emails.filter((email) => email.id !== id) });
  },

  sendDraft: async (email) => {
    await api.post("/send", {
      to: email.from,
      subject: email.subject,
      draft: email.draft,
      threadId: email.threadId,
    });

    const ratio = estimateDraftEditRatio(email.originalDraft, email.draft);
    await api.post("/feedback", {
      triageItemId: email.id,
      action: "send_draft",
      aiCategory: email.category,
      userCategory: email.category,
      draftEditRatio: ratio,
    });

    set({ emails: get().emails.filter((item) => item.id !== email.id) });
  },
}));
