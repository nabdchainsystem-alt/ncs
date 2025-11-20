
export enum Priority {
  Urgent = 'Urgent',
  High = 'High',
  Normal = 'Normal',
  Low = 'Low',
  None = 'None'
}

export enum Status {
  Todo = 'To do',
  InProgress = 'In Progress',
  Review = 'Review',
  Complete = 'Complete'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  email?: string;
}

export interface Space {
  id: string;
  name: string;
  color: string; // hex code
}

export interface Task {
  id: string;
  title: string;
  status: Status;
  priority: Priority;
  assignees: User[];
  dueDate?: string; // ISO Date string
  tags: string[];
  description?: string;
  spaceId: string; // Link to a Space
  order?: number; // For manual sorting
}

export interface Message {
  id: string;
  senderId: string;
  subject: string;
  preview: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  tags: ('inbox' | 'sent' | 'archived')[];
}

export interface HomeCard {
  instanceId: string;
  typeId: string;
  title: string;
  color: string; // Tailwind class for bg
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
}

export type ViewType = 'list' | 'board' | 'calendar' | 'dashboard';

export const STATUS_COLORS: Record<Status, string> = {
  [Status.Todo]: '#87909e',
  [Status.InProgress]: '#3b82f6',
  [Status.Review]: '#eab308',
  [Status.Complete]: '#22c55e',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.Urgent]: '#e44356',
  [Priority.High]: '#ffcc00',
  [Priority.Normal]: '#6fddff',
  [Priority.Low]: '#87909e',
  [Priority.None]: '#d1d5db',
};
