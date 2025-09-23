import React from 'react';

import { TasksProvider, useTasks } from '../../context/TasksContext';
import type { Task as ApiTask, TaskStatus as ApiTaskStatus } from '../../types';
import type { Task as BoardTask, TaskStatus as BoardTaskStatus } from './taskTypes';

const apiToBoardStatus: Record<ApiTaskStatus, BoardTaskStatus> = {
  TODO: 'To do',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
};

const boardToApiStatus: Record<BoardTaskStatus, ApiTaskStatus> = {
  'To do': 'TODO',
  'In Progress': 'IN_PROGRESS',
  Completed: 'COMPLETED',
  Blocked: 'IN_PROGRESS',
};

function toBoardTask(task: ApiTask): BoardTask {
  return {
    id: String(task.id),
    title: task.title,
    status: apiToBoardStatus[task.status] ?? 'In Progress',
    assignee: task.assignee ?? undefined,
    dueDate: task.dueDate ?? undefined,
    tags: task.tags ?? undefined,
    commentsCount: task.commentsCount ?? 0,
    description: task.description ?? undefined,
    priority: (task.priority as BoardTask['priority']) ?? undefined,
    department: task.custom?.department ?? undefined,
    createdAt: task.createdAt ?? undefined,
    updatedAt: task.updatedAt ?? undefined,
  };
}

export function TaskStoreProvider({ children }: { children: React.ReactNode }) {
  return <TasksProvider>{children}</TasksProvider>;
}

export function useTaskStore() {
  const { tasks, createTask, updateTask, deleteTask, refresh } = useTasks();

  const boardTasks = React.useMemo(() => tasks.map(toBoardTask), [tasks]);

  const addTask = React.useCallback(
    (input: Omit<BoardTask, 'id'>) => {
      const payload = {
        title: input.title,
        description: input.description ?? null,
        status: boardToApiStatus[input.status] ?? 'IN_PROGRESS',
        priority: input.priority ?? null,
        assignee: input.assignee ?? null,
        dueDate: input.dueDate ?? null,
      };
      createTask(payload)
        .then(() => refresh().catch(() => {}))
        .catch((error) => {
          console.error('[tasks] failed to create task', error);
        });
    },
    [createTask, refresh],
  );

  const updateTaskHandler = React.useCallback(
    (id: string, updates: Partial<BoardTask>) => {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) {
        console.warn('[tasks] invalid task id', id);
        return;
      }
      const payload: Partial<ApiTask> = {
        title: updates.title,
        description: updates.description,
        status: updates.status ? boardToApiStatus[updates.status] ?? 'IN_PROGRESS' : undefined,
        priority: updates.priority,
        assignee: updates.assignee,
        dueDate: updates.dueDate,
      };
      updateTask(numericId, payload)
        .then(() => refresh().catch(() => {}))
        .catch((error) => {
          console.error('[tasks] failed to update task', error);
        });
    },
    [updateTask, refresh],
  );

  const removeTask = React.useCallback(
    (id: string) => {
      const numericId = Number(id);
      if (!Number.isFinite(numericId)) {
        console.warn('[tasks] invalid task id', id);
        return;
      }
      deleteTask(numericId)
        .then(() => refresh().catch(() => {}))
        .catch((error) => {
          console.error('[tasks] failed to delete task', error);
        });
    },
    [deleteTask, refresh],
  );

  const filterByStatus = React.useCallback(
    (status: BoardTaskStatus) => boardTasks.filter((task) => task.status === status),
    [boardTasks],
  );

  return {
    tasks: boardTasks,
    addTask,
    updateTask: updateTaskHandler,
    removeTask,
    filterByStatus,
  };
}
