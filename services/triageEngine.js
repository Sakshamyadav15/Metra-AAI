import { v4 as uuid } from "uuid";
import { classifyEmail, generateDraft, priorityOrder } from "./aiProviderService.js";
import { fetchUnreadEmails } from "./gmailService.js";
import {
  getProcessedEmailIds,
  saveTriageItems,
  saveTriageRun,
  getRunItems,
} from "./persistenceService.js";
import { logAuditEvent } from "./auditService.js";
import { getPersonalizationContext } from "./personalizationService.js";

function getMockEmails() {
  return [
    {
      id: "mock-1",
      gmailMessageId: "mock-1",
      threadId: "mock-thread-1",
      from: "accounts@vendor.io",
      subject: "Invoice for March services",
      date: new Date().toISOString(),
      snippet: "Please process payment by Friday",
      body: "Hi team, attaching March invoice for completed consulting services. Please confirm payment schedule.",
    },
    {
      id: "mock-2",
      gmailMessageId: "mock-2",
      threadId: "mock-thread-2",
      from: "ceo@client.com",
      subject: "Need revised proposal by EOD",
      date: new Date().toISOString(),
      snippet: "Please share an updated proposal today",
      body: "Can you revise the scope and send an updated proposal by end of day? This is urgent for tomorrow's board review.",
    },
    {
      id: "mock-3",
      gmailMessageId: "mock-3",
      threadId: "mock-thread-3",
      from: "newsletter@updates.dev",
      subject: "Weekly engineering digest",
      date: new Date().toISOString(),
      snippet: "Top links from this week",
      body: "This week's digest contains updates on tooling, frontend architecture, and deployment best practices.",
    },
  ];
}

function classifyMock(email) {
  const raw = `${email.subject} ${email.body}`.toLowerCase();
  if (raw.includes("urgent") || raw.includes("eod")) {
    return {
      category: "Urgent",
      topic: "Customer",
      summary: "Customer requested a same-day response and delivery.",
      confidence: 0.91,
      modelProvider: "mock",
      classifyModel: "rule-engine-v1",
    };
  }
  if (raw.includes("invoice") || raw.includes("payment")) {
    return {
      category: "Routine",
      topic: "Finance",
      summary: "Vendor requested invoice confirmation and payment schedule.",
      confidence: 0.88,
      modelProvider: "mock",
      classifyModel: "rule-engine-v1",
    };
  }
  return {
    category: "FYI",
    topic: "Other",
    summary: "Informational message with non-urgent updates.",
    confidence: 0.83,
    modelProvider: "mock",
    classifyModel: "rule-engine-v1",
  };
}

function draftMock(email) {
  return {
    draft: `Hi,\n\nThanks for your email about \"${email.subject}\". I've reviewed it and will follow up shortly with the next steps.\n\nBest regards,`,
    modelProvider: "mock",
    draftModel: "template-v1",
  };
}

function normalizeGmailEmails(emails) {
  return emails.map((email) => ({
    ...email,
    gmailMessageId: email.gmailMessageId || email.id,
  }));
}

export async function runTriage({ user, tokens, mockMode, maxEmails = 10 }) {
  const runId = uuid();
  const startedAt = new Date().toISOString();
  saveTriageRun({
    id: runId,
    userId: user.id,
    status: "processing",
    totalEmails: 0,
    processedEmails: 0,
    startedAt,
  });

  const personalization = getPersonalizationContext(user.id);

  try {
    const sourceEmails = mockMode ? getMockEmails() : await fetchUnreadEmails(tokens, maxEmails);
    const normalizedEmails = normalizeGmailEmails(sourceEmails);
    const alreadyProcessed = getProcessedEmailIds(user.id);
    const emails = normalizedEmails.filter((email) => !alreadyProcessed.has(email.gmailMessageId));

    const output = [];
    for (const email of emails) {
      const classification = mockMode
        ? classifyMock(email)
        : await classifyEmail(email, personalization);

      const draftResult =
        classification.category === "Routine"
          ? mockMode
            ? draftMock(email)
            : await generateDraft(email, personalization)
          : { draft: "", modelProvider: classification.modelProvider, draftModel: null };

      const item = {
        ...email,
        ...classification,
        draft: draftResult.draft,
        modelProvider: classification.modelProvider,
        classifyModel: classification.classifyModel,
        draftModel: draftResult.draftModel,
      };

      output.push(item);

      logAuditEvent({
        organizationId: user.organization_id,
        userId: user.id,
        actor: "ai",
        action: "triage_classified",
        entityType: "email",
        entityId: item.gmailMessageId,
        modelProvider: item.modelProvider,
        modelName: item.classifyModel,
        confidence: item.confidence,
        metadata: {
          category: item.category,
          topic: item.topic,
          subject: item.subject,
        },
      });
    }

    const sorted = output.sort((a, b) => priorityOrder[a.category] - priorityOrder[b.category]);
    saveTriageItems(runId, user.id, sorted);

    saveTriageRun({
      id: runId,
      userId: user.id,
      status: "completed",
      totalEmails: normalizedEmails.length,
      processedEmails: sorted.length,
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    return {
      runId,
      status: "completed",
      emails: sorted,
      totalEmails: normalizedEmails.length,
      processedEmails: sorted.length,
    };
  } catch (error) {
    saveTriageRun({
      id: runId,
      userId: user.id,
      status: "failed",
      totalEmails: 0,
      processedEmails: 0,
      errorMessage: error?.response?.data?.error?.message || error.message,
      startedAt,
      finishedAt: new Date().toISOString(),
    });

    logAuditEvent({
      organizationId: user.organization_id,
      userId: user.id,
      actor: "system",
      action: "triage_failed",
      entityType: "triage_run",
      entityId: runId,
      metadata: {
        message: error?.response?.data?.error?.message || error.message,
      },
    });

    throw error;
  }
}

export function getTriageRunResult(runId) {
  const items = getRunItems(runId);
  return items.map((item) => ({
    id: item.gmail_message_id,
    gmailMessageId: item.gmail_message_id,
    threadId: item.thread_id,
    from: item.sender_email,
    subject: item.subject,
    snippet: item.snippet,
    body: item.body,
    category: item.category,
    topic: item.topic,
    summary: item.summary,
    confidence: item.confidence,
    draft: item.draft_text,
    modelProvider: item.model_provider,
    classifyModel: item.classify_model,
    draftModel: item.draft_model,
  }));
}
