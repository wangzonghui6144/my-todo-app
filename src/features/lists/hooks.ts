'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createList,
  deleteList,
  ensureDefaultList,
  fetchLists,
  updateList,
} from './api'

export const listsQueryKey = ['lists'] as const

export function useLists() {
  return useQuery({
    queryKey: listsQueryKey,
    queryFn: fetchLists,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useDefaultList() {
  const listsQuery = useLists()
  const fromCache = listsQuery.data?.find((l) => l.is_default) ?? null

  const ensureQuery = useQuery({
    queryKey: [...listsQueryKey, 'ensure-default'] as const,
    queryFn: ensureDefaultList,
    enabled: listsQuery.isSuccess && !fromCache,
    staleTime: 60_000,
    retry: 1,
  })

  return {
    data: fromCache ?? ensureQuery.data ?? null,
    isLoading: listsQuery.isLoading || (listsQuery.isSuccess && !fromCache && ensureQuery.isLoading),
    isError: listsQuery.isError || ensureQuery.isError,
    error: listsQuery.error ?? ensureQuery.error,
  }
}

export function useCreateList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createList(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listsQueryKey })
    },
  })
}

export function useUpdateList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string
      patch: { name?: string; color?: string }
    }) => updateList(id, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listsQueryKey })
    },
  })
}

export function useDeleteList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteList(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: listsQueryKey })
    },
  })
}
