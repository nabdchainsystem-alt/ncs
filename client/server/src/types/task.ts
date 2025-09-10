

// Types for Discussion Board Tasks

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export interface Task {
  id: number;
  title: string;
  description?: string | null;

  status: TaskStatus;
  priority?: string | null;
  assignee?: string | null;
  label?: string | null;
  dueDate?: string | null; // ISO date string

  order: number;
  commentsCount: number;

  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}