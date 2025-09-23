import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Task } from '../../types';
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  type CreateTaskPayload,
  type ListTasksParams,
  type UpdateTaskPayload,
} from './facade';

const tasksKeys = {
  root: ['tasks'] as const,
  list: (params: ListTasksParams = {}) => ['tasks', 'list', params] as const,
};

export function useTasks(params: ListTasksParams = {}) {
  const query = useQuery({
    queryKey: tasksKeys.list(params),
    queryFn: () => listTasks(params),
    staleTime: 30_000,
  });

  return {
    data: query.data ?? ([] as Task[]),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksKeys.root });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string | number; patch: UpdateTaskPayload }) => updateTask(id, patch),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksKeys.root });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => deleteTask(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tasksKeys.root });
    },
  });
}
