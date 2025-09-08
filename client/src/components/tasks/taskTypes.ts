// Task model & helpers

export type TaskID = string;

export type TaskStatus = 'To do' | 'In Progress' | 'Completed' | 'Blocked';

export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: TaskID;
  title: string;
  status: TaskStatus;
  assignee?: string;
  dueDate?: string;            // ISO date string
  tags?: string[];
  commentsCount?: number;
  description?: string;
  priority?: TaskPriority;
  department?: string;
  createdAt?: string;          // ISO
  updatedAt?: string;          // ISO
}

export interface TaskFilters {
  q?: string;                  // search text
  statuses?: TaskStatus[];
  assignees?: string[];
  tags?: string[];
  departments?: string[];
  dueRange?: { from?: string; to?: string }; // ISO dates
  priorities?: TaskPriority[];
}

export const TASK_STATUSES: TaskStatus[] = ['To do', 'In Progress', 'Completed', 'Blocked'];

export const DEFAULT_TASK: Omit<Task, 'id' | 'title' | 'status'> = {
  tags: [],
  commentsCount: 0,
  priority: 'Medium',
};