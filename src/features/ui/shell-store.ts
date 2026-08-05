import { create } from 'zustand'

type ShellState = {
  drawerOpen: boolean
  selectedTaskId: string | null
  setDrawerOpen: (open: boolean) => void
  selectTask: (id: string | null) => void
}

export const useShellStore = create<ShellState>((set) => ({
  drawerOpen: false,
  selectedTaskId: null,
  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
  selectTask: (selectedTaskId) => set({ selectedTaskId }),
}))
