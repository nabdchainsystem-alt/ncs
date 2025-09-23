import type { Task, TaskStatus } from '../../types';
import { apiClient } from '../../lib/api';

export type ListTasksParams = {
  state?: string;
  status?: string;
  assignee?: string;
  q?: string;
  tag?: string;
};

export type CreateTaskPayload = {
  title: string;
  description?: string | null;
  state?: string;
  status?: string;
  assignee?: string | null;
  dueDate?: string | null;
  tags?: string[] | null;
  order?: number | null;
};

export type UpdateTaskPayload = Partial<CreateTaskPayload> & {
  state?: string;
  status?: string;
};

function buildQuery(params: ListTasksParams = {}) {
  const search = new URLSearchParams();
  if (params.state) search.set('state', params.state);
  if (params.status) search.set('status', params.status);
  if (params.assignee) search.set('assignee', params.assignee);
  if (params.q) search.set('q', params.q);
  if (params.tag) search.set('tag', params.tag);
  const query = search.toString();
  return query ? `?${query}` : '';
}

function mapStateToStatus(state?: string | null): TaskStatus {
  switch ((state ?? '').toLowerCase()) {
    case 'todo':
    case 'open':
      return 'TODO';
    case 'inprogress':
    case 'in_progress':
    case 'in-progress':
    case 'progress':
      return 'IN_PROGRESS';
    case 'done':
    case 'complete':
    case 'completed':
    case 'closed':
      return 'COMPLETED';
    default:
      return 'TODO';
  }
}

function normalizeTask(task: Task | (Task & { state?: string | null })): Task {
  if (task.status) return task as Task;
  const status = mapStateToStatus((task as any).state);
  return { ...task, status } as Task;
}

export async function listTasks(params: ListTasksParams = {}): Promise<Task[]> {
  const query = buildQuery(params);
  const { data } = await apiClient.get<{ ok?: boolean; data?: Task[] }>(`/api/tasks${query}`);
  const records = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return records.map(normalizeTask);
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const body = payload.state && !payload.status ? { ...payload, status: payload.state } : payload;
  const { data } = await apiClient.post<{ ok?: boolean; data: Task }>(`/api/tasks`, body);
  if (!data?.data) {
    throw new Error('Failed to create task');
  }
  return data.data;
}

export async function updateTask(id: string | number, patch: UpdateTaskPayload): Promise<Task> {
  const taskId = String(id);
  if (!taskId) throw new Error('Task id is required');
  const body = patch.state && !patch.status ? { ...patch, status: patch.state } : patch;
  const { data } = await apiClient.patch<{ ok?: boolean; data: Task }>(`/api/tasks/${taskId}`, body);
  if (!data?.data) {
    throw new Error('Failed to update task');
  }
  return data.data;
}

export async function deleteTask(id: string | number): Promise<void> {
  const taskId = String(id);
  if (!taskId) throw new Error('Task id is required');
  await apiClient.delete(`/api/tasks/${taskId}`);
}
