import { StateCreator } from 'zustand'

export interface Toast {
  id: string
  title: string
  description?: string
  type: 'default' | 'success' | 'error' | 'warning'
}

export interface UIState {
  sidebarOpen: boolean
  toasts: Toast[]
  setSidebarOpen: (open: boolean) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const createUISlice: StateCreator<UIState> = (set) => ({
  sidebarOpen: true,
  toasts: [],
  setSidebarOpen: (open) => {
    set({ sidebarOpen: open })
  },
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 3000)
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
})
