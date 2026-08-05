'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Attachment } from '@/types/database'
import {
  deleteAttachment,
  fetchAttachments,
  uploadAttachment,
} from './api'

export const attachmentsQueryKey = (taskId: string) =>
  ['attachments', taskId] as const

export function useAttachments(taskId: string | null) {
  return useQuery({
    queryKey: attachmentsQueryKey(taskId ?? ''),
    queryFn: () => fetchAttachments(taskId!),
    enabled: Boolean(taskId),
  })
}

export function useUploadAttachment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => uploadAttachment(taskId, file),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attachmentsQueryKey(taskId),
      })
    },
  })
}

export function useDeleteAttachment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (attachment: Attachment) => deleteAttachment(attachment),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: attachmentsQueryKey(taskId),
      })
    },
  })
}
