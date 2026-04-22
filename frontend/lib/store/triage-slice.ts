import { StateCreator } from 'zustand'
import { apiGet, apiPost } from '@/lib/api'

export interface Email {
  id: string
  threadId?: string
  generatedDraft?: string
  from: string
  subject: string
  body: string
  category: string
  timestamp: Date
  confidence: number
}

export interface Draft {
  emailId: string
  content: string
  isDirty: boolean
}

export interface TriageState {
  emails: Email[]
  drafts: Record<string, Draft>
  selectedEmailId: string | null
  isTriaging: boolean
  runTriage: () => Promise<void>
  selectEmail: (emailId: string) => void
  updateDraft: (emailId: string, content: string) => void
  sendEmail: (emailId: string) => Promise<void>
  discardDraft: (emailId: string) => Promise<void>
  setEmails: (emails: Email[]) => void
}

interface RawEmail {
  id?: string
  gmail_message_id?: string
  gmailMessageId?: string
  thread_id?: string
  threadId?: string
  sender_email?: string
  from?: string
  subject?: string
  snippet?: string
  body?: string
  category?: string
  confidence?: number
  draft_text?: string
  draft?: string
}

function normalizeEmail(item: RawEmail): Email {
  const id = item.id || item.gmailMessageId || item.gmail_message_id || crypto.randomUUID()
  return {
    id,
    threadId: item.threadId || item.thread_id,
    generatedDraft: item.draft ?? item.draft_text ?? '',
    from: item.from || item.sender_email || 'unknown@unknown',
    subject: item.subject || '(No subject)',
    body: item.body || item.snippet || '',
    category: item.category || 'FYI',
    confidence: item.confidence ?? 0,
    timestamp: new Date(),
  }
}

async function waitForJobEmails(jobId: string): Promise<RawEmail[]> {
  const startedAt = Date.now()
  while (Date.now() - startedAt < 30000) {
    const status = await apiGet<{
      status: string
      result?: { emails?: RawEmail[] }
      error?: string
    }>(`/jobs/${jobId}`)

    if (status.status === 'completed') {
      return status.result?.emails || []
    }
    if (status.status === 'failed') {
      throw new Error(status.error || 'Triage job failed')
    }

    await new Promise((resolve) => setTimeout(resolve, 900))
  }

  const history = await apiGet<{ emails: RawEmail[] }>('/jobs/history/latest')
  return history.emails || []
}

export const createTriageSlice: StateCreator<TriageState> = (set, get) => ({
  emails: [],
  drafts: {},
  selectedEmailId: null,
  isTriaging: false,
  runTriage: async () => {
    set({ isTriaging: true })
    try {
      const queued = await apiPost<{ jobId: string }>('/jobs/triage', {})
      const items = await waitForJobEmails(queued.jobId)
      const emails = items.map(normalizeEmail)
      const drafts = emails.reduce<Record<string, Draft>>((acc, email) => {
        acc[email.id] = {
          emailId: email.id,
          content: email.generatedDraft || '',
          isDirty: false,
        }
        return acc
      }, {})

      set({
        emails,
        drafts,
        selectedEmailId: emails[0]?.id || null,
      })
    } finally {
      set({ isTriaging: false })
    }
  },
  selectEmail: (emailId) => {
    set((state) => {
      const selected = state.emails.find((email) => email.id === emailId)
      const existingDraft = state.drafts[emailId]
      return {
        selectedEmailId: emailId,
        drafts: existingDraft
          ? state.drafts
          : {
              ...state.drafts,
              [emailId]: {
                emailId,
                content: selected?.generatedDraft || '',
                isDirty: false,
              },
            },
      }
    })
  },
  updateDraft: (emailId, content) => {
    set((state) => ({
      drafts: {
        ...state.drafts,
        [emailId]: {
          emailId,
          content,
          isDirty: true,
        },
      },
    }))
  },
  sendEmail: async (emailId) => {
    const state = get()
    const draft = state.drafts[emailId]
    const email = state.emails.find((item) => item.id === emailId)
    if (!draft || !email) return

    try {
      await apiPost<{ ok: boolean }>('/send', {
        to: email.from,
        subject: email.subject,
        draft: draft.content,
        threadId: email.threadId || email.id,
      })
      set((state) => ({
        emails: state.emails.filter((e) => e.id !== emailId),
        selectedEmailId:
          state.selectedEmailId === emailId
            ? state.emails.find((e) => e.id !== emailId)?.id || null
            : state.selectedEmailId,
        drafts: {
          ...state.drafts,
          [emailId]: { ...draft, isDirty: false },
        },
      }))
    } catch (error) {
      console.error('Failed to send email:', error)
    }
  },
  discardDraft: async (emailId) => {
    await apiPost<{ ok: boolean }>('/discard', { id: emailId })
    set((state) => {
      const { [emailId]: _removed, ...remainingDrafts } = state.drafts
      return {
        emails: state.emails.filter((e) => e.id !== emailId),
        selectedEmailId:
          state.selectedEmailId === emailId
            ? state.emails.find((e) => e.id !== emailId)?.id || null
            : state.selectedEmailId,
        drafts: remainingDrafts,
      }
    })
  },
  setEmails: (emails) => {
    set({ emails })
  },
})
