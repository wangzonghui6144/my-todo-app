'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MemberRole } from '@/types/database'
import { listsQueryKey } from '@/features/lists/hooks'
import {
  fetchListMembers,
  fetchPendingInvites,
  inviteToList,
  removeListMember,
  respondToInvite,
} from './api'

export const listMembersQueryKey = (listId: string) =>
  ['list-members', listId] as const
export const pendingInvitesQueryKey = ['invites', 'pending'] as const

export function useListMembers(listId: string | null) {
  return useQuery({
    queryKey: listMembersQueryKey(listId ?? ''),
    queryFn: () => fetchListMembers(listId!),
    enabled: Boolean(listId),
  })
}

export function usePendingInvites() {
  return useQuery({
    queryKey: pendingInvitesQueryKey,
    queryFn: fetchPendingInvites,
  })
}

export function useInviteToList(listId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      email: string
      role: Exclude<MemberRole, 'owner'>
    }) => inviteToList({ listId, ...input }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: listMembersQueryKey(listId),
      })
    },
  })
}

export function useRespondToInvite() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      memberId,
      status,
    }: {
      memberId: string
      status: 'accepted' | 'declined'
    }) => respondToInvite(memberId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: pendingInvitesQueryKey })
      void queryClient.invalidateQueries({ queryKey: listsQueryKey })
    },
  })
}

export function useRemoveListMember(listId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: removeListMember,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: listMembersQueryKey(listId),
      })
    },
  })
}
