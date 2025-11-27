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

export type Permissions = Record<string, boolean>;

export const DEFAULT_PERMISSIONS: Permissions = {
    // Sections
    departments: true,
    smartTools: true,
    marketplace: true,

    // Top Level
    inbox: true,
    discussion: true,
    overview: true,
    goals: true,
    reminders: true,
    tasks: true,
    vault: true,
    teams: true,

    // Supply Chain
    'supply-chain': true,
    'supply-chain/procurement': true,
    'supply-chain/warehouse': true,
    'supply-chain/shipping': true,
    'supply-chain/planning': true,
    'supply-chain/fleet': true,
    'supply-chain/vendors': true,

    // Operations
    'operations': true,
    'operations/maintenance': true,
    'operations/production': true,
    'operations/quality': true,

    // Business
    'business': true,
    'business/sales': true,
    'business/finance': true,

    // Support
    'support': true,
    'support/it': true,
    'support/hr': true,
    'support/marketing': true,

    // Smart Tools
    'smart-tools/mind-map': true,
    'smart-tools/dashboard': true,

    // Marketplace
    'marketplace/local': true,
    'marketplace/foreign': true
};

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
