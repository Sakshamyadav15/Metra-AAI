import { create } from 'zustand'
import type { AuthState } from './auth-slice'
import type { TriageState } from './triage-slice'
import type { JobsState } from './jobs-slice'
import type { UIState } from './ui-slice'
import { createAuthSlice } from './auth-slice'
import { createTriageSlice } from './triage-slice'
import { createJobsSlice } from './jobs-slice'
import { createUISlice } from './ui-slice'

export type AppStore = AuthState & TriageState & JobsState & UIState

export const useAppStore = create<AppStore>((...args) => ({
  ...createAuthSlice(...args),
  ...createTriageSlice(...args),
  ...createJobsSlice(...args),
  ...createUISlice(...args),
}))

// Export individual hooks for better tree-shaking
export const useAuth = () =>
  useAppStore((state) => ({
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    checkSession: state.checkSession,
    signIn: state.signIn,
    signOut: state.signOut,
    setUser: state.setUser,
  }))

export const useTriage = () =>
  useAppStore((state) => ({
    emails: state.emails,
    drafts: state.drafts,
    selectedEmailId: state.selectedEmailId,
    isTriaging: state.isTriaging,
    runTriage: state.runTriage,
    selectEmail: state.selectEmail,
    updateDraft: state.updateDraft,
    sendEmail: state.sendEmail,
    discardDraft: state.discardDraft,
    setEmails: state.setEmails,
  }))

export const useJobs = () =>
  useAppStore((state) => ({
    jobs: state.jobs,
    activeJobId: state.activeJobId,
    addJob: state.addJob,
    updateJob: state.updateJob,
    setActiveJob: state.setActiveJob,
    fetchJobs: state.fetchJobs,
    pollJobStatus: state.pollJobStatus,
  }))

export const useUI = () =>
  useAppStore((state) => ({
    sidebarOpen: state.sidebarOpen,
    toasts: state.toasts,
    setSidebarOpen: state.setSidebarOpen,
    addToast: state.addToast,
    removeToast: state.removeToast,
  }))
