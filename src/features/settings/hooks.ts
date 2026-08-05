'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Locale } from '@/types/database'
import { fetchProfile, updateProfileSettings } from './api'

export const profileQueryKey = ['profile'] as const

export function useProfile() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: fetchProfile,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useUpdateProfileSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfileSettings,
    onSuccess: (profile) => {
      queryClient.setQueryData(profileQueryKey, profile)
    },
  })
}

export function useUpdateLocale() {
  const update = useUpdateProfileSettings()
  return {
    ...update,
    mutateLocale: (locale: Locale) => update.mutate({ locale }),
  }
}
