'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Task, TaskStep } from '@/types/database'
import {
  createTask,
  deleteTask,
  fetchAllTasks,
  fetchTask,
  fetchTasksForList,
  updateTask,
  type TaskPatch,
} from './api'
import { addStep, fetchSteps, toggleStep } from './api-steps'

export const allTasksQueryKey = ['tasks', 'all'] as const
export const listTasksQueryKey = (listId: string) =>
  ['tasks', 'list', listId] as const
export const taskQueryKey = (id: string) => ['tasks', 'one', id] as const
export const stepsQueryKey = (taskId: string) =>
  ['tasks', 'steps', taskId] as const

function patchTaskInList(list: Task[] | undefined, id: string, patch: TaskPatch) {
  if (!list) return list
  return list.map((task) => {
    if (task.id !== id) return task
    const next: Task = { ...task, ...patch, updated_at: new Date().toISOString() }
    if (patch.is_completed === true) {
      next.completed_at = new Date().toISOString()
    } else if (patch.is_completed === false) {
      next.completed_at = null
    }
    return next
  })
}

export function useTasksForList(listId: string) {
  return useQuery({
    queryKey: listTasksQueryKey(listId),
    queryFn: () => fetchTasksForList(listId),
    enabled: Boolean(listId),
    staleTime: 30_000,
    retry: 1,
    placeholderData: (prev) => prev,
  })
}

export function useAllTasks(enabled = true) {
  return useQuery({
    queryKey: allTasksQueryKey,
    queryFn: fetchAllTasks,
    enabled,
    staleTime: 30_000,
    retry: 1,
    placeholderData: (prev) => prev,
  })
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: taskQueryKey(id ?? ''),
    queryFn: () => fetchTask(id!),
    enabled: Boolean(id),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTask,
    onSuccess: (task) => {
      void queryClient.invalidateQueries({ queryKey: listTasksQueryKey(task.list_id) })
      void queryClient.invalidateQueries({ queryKey: allTasksQueryKey })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TaskPatch }) =>
      updateTask(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })

      const previousAll = queryClient.getQueryData<Task[]>(allTasksQueryKey)
      const previousOne = queryClient.getQueryData<Task>(taskQueryKey(id))
      const listCaches = queryClient.getQueriesData<Task[]>({
        queryKey: ['tasks', 'list'],
      })

      queryClient.setQueryData<Task[]>(allTasksQueryKey, (old) =>
        patchTaskInList(old, id, patch)
      )
      queryClient.setQueryData<Task>(taskQueryKey(id), (old) =>
        old
          ? {
              ...old,
              ...patch,
              updated_at: new Date().toISOString(),
              completed_at:
                patch.is_completed === true
                  ? new Date().toISOString()
                  : patch.is_completed === false
                    ? null
                    : old.completed_at,
            }
          : old
      )
      for (const [key, data] of listCaches) {
        queryClient.setQueryData<Task[]>(key, patchTaskInList(data, id, patch))
      }

      return { previousAll, previousOne, listCaches }
    },
    onError: (_err, { id }, context) => {
      if (!context) return
      if (context.previousAll) {
        queryClient.setQueryData(allTasksQueryKey, context.previousAll)
      }
      if (context.previousOne) {
        queryClient.setQueryData(taskQueryKey(id), context.previousOne)
      }
      for (const [key, data] of context.listCaches) {
        queryClient.setQueryData(key, data)
      }
    },
    onSettled: (task, _err, { id }) => {
      void queryClient.invalidateQueries({ queryKey: allTasksQueryKey })
      void queryClient.invalidateQueries({ queryKey: taskQueryKey(id) })
      if (task) {
        void queryClient.invalidateQueries({
          queryKey: listTasksQueryKey(task.list_id),
        })
      } else {
        void queryClient.invalidateQueries({ queryKey: ['tasks', 'list'] })
      }
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTask,
    onSuccess: (_void, id) => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.removeQueries({ queryKey: taskQueryKey(id) })
    },
  })
}

export function useTaskSteps(taskId: string | null) {
  return useQuery({
    queryKey: stepsQueryKey(taskId ?? ''),
    queryFn: () => fetchSteps(taskId!),
    enabled: Boolean(taskId),
  })
}

export function useAddStep(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => addStep(taskId, title),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: stepsQueryKey(taskId) })
    },
  })
}

export function useToggleStep(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, is_completed }: { id: string; is_completed: boolean }) =>
      toggleStep(id, is_completed),
    onMutate: async ({ id, is_completed }) => {
      await queryClient.cancelQueries({ queryKey: stepsQueryKey(taskId) })
      const previous = queryClient.getQueryData<TaskStep[]>(stepsQueryKey(taskId))
      queryClient.setQueryData<TaskStep[]>(stepsQueryKey(taskId), (old) =>
        old?.map((step) =>
          step.id === id ? { ...step, is_completed } : step
        )
      )
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(stepsQueryKey(taskId), context.previous)
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: stepsQueryKey(taskId) })
    },
  })
}
