import { StateCreator } from 'zustand'
import { apiGet } from '@/lib/api'

export interface Job {
  id: string
  type: 'triage' | 'feedback' | 'export'
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress: number
  createdAt: Date
  completedAt?: Date
  error?: string
}

export interface JobsState {
  jobs: Job[]
  activeJobId: string | null
  addJob: (job: Job) => void
  updateJob: (id: string, updates: Partial<Job>) => void
  setActiveJob: (id: string | null) => void
  fetchJobs: () => Promise<void>
  pollJobStatus: (jobId: string) => Promise<void>
}

type RawRun = {
  id: string
  status: string
  started_at?: string
  finished_at?: string
}

function mapStatus(status: string): Job['status'] {
  if (status === 'completed') return 'completed'
  if (status === 'failed') return 'failed'
  if (status === 'processing' || status === 'active') return 'running'
  return 'queued'
}

function mapJob(run: RawRun): Job {
  return {
    id: run.id,
    type: 'triage',
    status: mapStatus(run.status),
    progress: run.status === 'completed' ? 100 : run.status === 'processing' ? 60 : 20,
    createdAt: new Date(run.started_at || Date.now()),
    completedAt: run.finished_at ? new Date(run.finished_at) : undefined,
  }
}

export const createJobsSlice: StateCreator<JobsState> = (set, get) => ({
  jobs: [],
  activeJobId: null,
  addJob: (job) => {
    set((state) => ({
      jobs: [job, ...state.jobs],
      activeJobId: job.id,
    }))
  },
  updateJob: (id, updates) => {
    set((state) => ({
      jobs: state.jobs.map((job) => (job.id === id ? { ...job, ...updates } : job)),
    }))
  },
  setActiveJob: (id) => {
    set({ activeJobId: id })
  },
  fetchJobs: async () => {
    const data = await apiGet<{ jobs: RawRun[] }>('/jobs')
    set({ jobs: (data.jobs || []).map(mapJob) })
  },
  pollJobStatus: async (jobId) => {
    try {
      const status = await apiGet<{ status: string; error?: string; finishedAt?: string }>(`/jobs/${jobId}`)
      const mapped = mapStatus(status.status)
      get().updateJob(jobId, {
        status: mapped,
        progress: mapped === 'completed' ? 100 : mapped === 'running' ? 60 : 20,
        completedAt: status.finishedAt ? new Date(status.finishedAt) : undefined,
        error: status.error,
      })
    } catch (error) {
      console.error('Failed to poll job status:', error)
      get().updateJob(jobId, { status: 'failed', error: String(error) })
    }
  },
})
