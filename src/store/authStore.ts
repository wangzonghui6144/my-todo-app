import { create } from 'zustand'
import { User } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthState {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  checkUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata.name || '',
          created_at: data.user.created_at,
          updated_at: new Date().toISOString(),
        },
      })
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) throw error

    if (data.user) {
      set({
        user: {
          id: data.user.id,
          email: data.user.email!,
          name: name,
          created_at: data.user.created_at,
          updated_at: new Date().toISOString(),
        },
      })
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ user: null })
  },

  checkUser: async () => {
    set({ isLoading: true })
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      set({
        user: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata.name || '',
          created_at: user.created_at,
          updated_at: new Date().toISOString(),
        },
        isLoading: false,
      })
    } else {
      set({ user: null, isLoading: false })
    }
  },
}))