import { StateCreator } from 'zustand'
import { apiGet, apiBaseUrl } from '@/lib/api'

interface SessionUser {
  id: string
  email?: string
  displayName?: string
}

interface SessionResponse {
  authenticated: boolean
  mock: boolean
  userId: string | null
  user?: SessionUser | null
}

export interface AuthState {
  user: { id: string; email: string; name: string } | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: () => Promise<void>
  checkSession: () => Promise<void>
  signOut: () => void
  setUser: (user: AuthState['user']) => void
}

export const createAuthSlice: StateCreator<AuthState> = (set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,
  checkSession: async () => {
    set({ isLoading: true })
    try {
      const data = await apiGet<SessionResponse>('/auth/session')
      const sessionUser = data.user
      const nextUser = data.authenticated
        ? {
            id: sessionUser?.id || data.userId || 'session-user',
            email: sessionUser?.email || 'user@local',
            name: sessionUser?.displayName || sessionUser?.email || 'User',
          }
        : null

      set({
        user: nextUser,
        isAuthenticated: data.authenticated,
      })
    } catch {
      set({
        user: null,
        isAuthenticated: false,
      })
    } finally {
      set({ isLoading: false })
    }
  },
  signIn: async () => {
    if (typeof window === 'undefined') {
      return
    }

    const authUrl = `${apiBaseUrl.replace(/\/api$/, '')}/api/auth/google`
    window.location.assign(authUrl)
  },
  signOut: () => {
    set({
      user: null,
      isAuthenticated: false,
    })
  },
  setUser: (user) => {
    set({ user, isAuthenticated: !!user })
  },
})
