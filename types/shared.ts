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
