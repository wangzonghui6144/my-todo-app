'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createList, fetchDefaultList, fetchLists } from './api'

export const listsQueryKey = ['lists'] as const

export function useLists() {
  return useQuery({
    queryKey: listsQueryKey,
    queryFn: fetchLists,
  })
}

export function useDefaultList() {
  return useQuery({
    queryKey: [...listsQueryKey, 'default'] as const,
    queryFn: fetchDefaultList,
  })
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
