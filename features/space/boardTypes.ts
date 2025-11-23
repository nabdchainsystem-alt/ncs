export enum Status {
    Done = 'Done',
    Working = 'Working on it',
    Stuck = 'Stuck',
    Empty = ''
}

export enum Priority {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low',
    Empty = ''
}

export type ColumnType = 'name' | 'person' | 'status' | 'priority' | 'date' | 'text';

export interface IColumn {
    id: string;
    title: string;
    type: ColumnType;
    width: string;
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
}

export interface IGroup {
    id: string;
    title: string;
    color: string; // Hex color for the group side border
    tasks: ITask[];
}

export interface IBoard {
    id: string;
    name: string;
    columns: IColumn[];
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
    [Status.Done]: 'bg-[#00C875] hover:bg-[#00B66A] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Status.Working]: 'bg-[#FDAB3D] hover:bg-[#E69A35] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Status.Stuck]: 'bg-[#E2445C] hover:bg-[#CE3D53] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Status.Empty]: 'bg-[#C4C4C4] hover:bg-[#B0B0B0] text-white',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
    [Priority.High]: 'bg-[#333333] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Priority.Medium]: 'bg-[#401694] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Priority.Low]: 'bg-[#579BFC] text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.1)]',
    [Priority.Empty]: 'bg-[#C4C4C4] text-white',
};

export const GROUP_COLORS = [
    '#579bfc', // Blue
    '#00c875', // Green
    '#ffcb00', // Yellow
    '#ff5ac4', // Pink
    '#a25ddc', // Purple
    '#0086c0', // Dark Blue
    '#784bd1', // Deep Purple
];

export const PEOPLE: IPerson[] = [
    { id: 'p1', name: 'Alex', initials: 'AL', color: 'bg-blue-500' },
    { id: 'p2', name: 'Sam', initials: 'SA', color: 'bg-amber-500' },
    { id: 'p3', name: 'Jordan', initials: 'JO', color: 'bg-purple-600' },
    { id: 'p4', name: 'Taylor', initials: 'TA', color: 'bg-emerald-500' },
    { id: 'p5', name: 'Casey', initials: 'CA', color: 'bg-rose-500' },
    { id: 'p6', name: 'Drew', initials: 'DR', color: 'bg-indigo-500' },
];

export const INITIAL_DATA: IBoard = {
    id: 'board-1',
    name: 'Task Board',
    columns: [
        { id: 'col_name', title: 'Item', type: 'name', width: '300px' },
        { id: 'col_person', title: 'Owner', type: 'person', width: '96px' },
        { id: 'col_status', title: 'Status', type: 'status', width: '128px' },
        { id: 'col_priority', title: 'Priority', type: 'priority', width: '128px' },
        { id: 'col_date', title: 'Due Date', type: 'date', width: '110px' },
    ],
    groups: [],
};
