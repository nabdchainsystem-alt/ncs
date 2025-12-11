
export type Priority = 'none' | 'low' | 'medium' | 'high';

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Reminder {
    id: string;
    title: string;
    notes?: string;
    dueDate?: string; // ISO string or 'Today', 'Tomorrow'
    secondaryDueDate?: string;
    time?: string;
    priority: Priority;
    listId: string;
    tags: string[];
    completed: boolean;
    subtasks: Subtask[];
    createdAt?: string;
    company_id?: string;
}

export interface List {
    id: string;
    name: string;
    icon?: any;
    type: 'smart' | 'project';
    count: number;
    color?: string;
    company_id?: string;
}

export type FilterType = 'inbox' | 'today' | 'scheduled' | 'flagged' | 'completed' | 'all' | string;
