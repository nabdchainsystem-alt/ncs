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
}
