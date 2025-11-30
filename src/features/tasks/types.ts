import { Status, Priority, User } from '../../types/shared';

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

    // New fields for enhancements
    subtasks?: { id: string; title: string; completed: boolean }[];
    attachments?: string[]; // URLs or paths
    goalId?: string; // Link to a Goal
    reminderId?: string; // Link to a Reminder
}
