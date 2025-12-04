export enum Status {
    New = 'New',
    Pending = 'Pending',
    Working = 'Working on it',
    Stuck = 'Stuck',
    AlmostFinish = 'Almost Finish',
    Done = 'Done'
}

export enum Priority {
    Normal = 'Normal',
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
    Urgent = 'Urgent'
}

export type ColumnType = 'name' | 'status' | 'text' | 'person' | 'priority' | 'date' | 'dropdown' | 'long_text' | 'number' | 'checkbox' | 'money' | 'website' | 'email' | 'phone' | 'location' | 'rating' | 'progress_manual' | 'button';

export interface IColumn {
    id: string;
    title: string;
    type: ColumnType;
    width: string;
    options?: { id: string; label: string; color: string; }[];
    currency?: string;
}

export interface IPerson {
    id: string;
    name: string;
    initials: string;
    color: string; // Tailwind class or hex
}

export interface ITask {
    id: string;
    name: string;
    status: Status;
    priority: Priority;
    dueDate: string;
    personId: string | null;
    textValues: Record<string, string>; // For dynamic text columns: key is column.id
    selected?: boolean;
    subtasks?: ITask[];
}

export interface IGroup {
    id: string;
    title: string;
    color: string; // Hex color for the group side border
    tasks: ITask[];
    columns: IColumn[];
    isPinned?: boolean;
}

export interface IBoard {
    id: string;
    name: string;
    groups: IGroup[];
}

export type AIGeneratedTask = {
    name: string;
    priority: string;
    dueDateOffsetDays: number; // How many days from now
};

export interface DragItem {
    taskId: string;
    groupId: string;
}

export const STATUS_COLORS: Record<Status, string> = {
    [Status.New]: 'bg-gradient-to-r from-[#A0A5B9] to-[#8D92A6] text-white shadow-sm',
    [Status.Pending]: 'bg-gradient-to-r from-[#FFD940] to-[#FFCC00] text-white shadow-sm',
    [Status.Working]: 'bg-gradient-to-r from-[#FFBE66] to-[#FFA533] hover:from-[#FFA533] hover:to-[#FF991F] text-white shadow-sm',
    [Status.Stuck]: 'bg-gradient-to-r from-[#FF7085] to-[#FF526B] hover:from-[#FF526B] hover:to-[#FF3352] text-white shadow-sm',
    [Status.AlmostFinish]: 'bg-gradient-to-r from-[#C48AF0] to-[#B06CE0] text-white shadow-sm',
    [Status.Done]: 'bg-gradient-to-r from-[#33D995] to-[#00C875] hover:from-[#00C875] hover:to-[#00B067] text-white shadow-sm',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
    [Priority.Normal]: 'bg-gradient-to-r from-[#D9D9D9] to-[#C4C4C4] text-white shadow-sm',
    [Priority.Low]: 'bg-gradient-to-r from-[#82B4FF] to-[#579BFC] text-white shadow-sm',
    [Priority.Medium]: 'bg-gradient-to-r from-[#FFBE66] to-[#FFA533] text-white shadow-sm',
    [Priority.High]: 'bg-gradient-to-r from-[#7048C4] to-[#552CB0] text-white shadow-sm',
    [Priority.Urgent]: 'bg-gradient-to-r from-[#FF7085] to-[#FF526B] text-white shadow-sm',
};

export const GROUP_COLORS = [
    '#3B82F6', // Blue 500
    '#10B981', // Emerald 500
    '#F59E0B', // Amber 500
    '#EC4899', // Pink 500
    '#8B5CF6', // Violet 500
    '#0EA5E9', // Sky 500
    '#7C3AED', // Violet 600
];

export const PEOPLE: IPerson[] = [
    { id: 'p1', name: 'Max', initials: 'MA', color: 'bg-gradient-to-br from-blue-400 to-blue-600' },
    { id: 'p2', name: 'Hasan', initials: 'HA', color: 'bg-gradient-to-br from-emerald-400 to-emerald-600' },
    { id: 'p3', name: 'Sarah', initials: 'SA', color: 'bg-gradient-to-br from-purple-400 to-purple-600' },
    { id: 'p4', name: 'John', initials: 'JO', color: 'bg-gradient-to-br from-amber-400 to-amber-600' },
];

export const INITIAL_DATA: IBoard = {
    id: 'board-1',
    name: 'Task Board',
    groups: [
        {
            id: 'group-1',
            title: 'New Group',
            color: '#579bfc',
            columns: [
                { id: 'col_name', title: 'Item', type: 'name', width: '300px' },
                { id: 'col_person', title: 'Owner', type: 'person', width: '96px' },
                { id: 'col_status', title: 'Status', type: 'status', width: '128px' },
                { id: 'col_priority', title: 'Priority', type: 'priority', width: '128px' },
                { id: 'col_date', title: 'Due Date', type: 'date', width: '110px' },
            ],
            tasks: []
        }
    ],
};
