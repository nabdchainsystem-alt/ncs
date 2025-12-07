import { v4 as uuidv4 } from 'uuid';

export interface Reminder {
    id: string;
    title: string;
    notes?: string;
    dueDate?: string; // ISO date or 'Today', 'Tomorrow'
    secondaryDueDate?: string;
    time?: string;
    priority: 'none' | 'low' | 'medium' | 'high';
    listId: string;
    tags: string[];
    completed: boolean;
    subtasks: { id: string; title: string; completed: boolean }[];
}

export interface List {
    id: string;
    name: string;
    icon?: any; // ReactNode is hard to serialize, storing type/name might be better but for now we'll handle icons in UI
    type: 'smart' | 'project';
    count: number;
    color?: string;
}

const LISTS_STORAGE_KEY = 'reminders-lists-data';
const STORAGE_KEY = 'reminders-data';

const INITIAL_REMINDERS: Reminder[] = [
    {
        id: '1', title: 'Review Q3 Financials', notes: 'Check the EBITDA margins specifically.',
        dueDate: 'Today', priority: 'high', listId: 'inbox', tags: ['finance', 'urgent'], completed: false,
        subtasks: [
            { id: 's1', title: 'Download report from Netsuite', completed: true },
            { id: 's2', title: 'Email summary to Board', completed: false }
        ]
    },
    {
        id: '2', title: 'Call with potential investor', notes: 'Prepare pitch deck v3.',
        dueDate: 'Today', priority: 'medium', listId: 'work', tags: ['fundraising'], completed: false,
        subtasks: []
    },
    {
        id: '3', title: 'Buy anniversary gift', notes: '',
        dueDate: 'Tomorrow', priority: 'high', listId: 'personal', tags: [], completed: false,
        subtasks: []
    },
    {
        id: '4', title: 'Update team on roadmap', notes: 'Focus on Q4 deliverables.',
        dueDate: 'Next Week', priority: 'medium', listId: 'work', tags: ['strategy'], completed: false,
        subtasks: []
    },
    {
        id: '5', title: 'Schedule dentist appointment', notes: '',
        dueDate: undefined, priority: 'low', listId: 'inbox', tags: ['health'], completed: false,
        subtasks: []
    }
];

const INITIAL_LISTS: List[] = [
    { id: 'work', name: 'Work Projects', type: 'project', count: 0, color: 'text-black' },
    { id: 'personal', name: 'Personal', type: 'project', count: 0, color: 'text-black' },
    { id: 'shopping', name: 'Shopping', type: 'project', count: 0, color: 'text-black' },
];

export const remindersService = {
    getReminders: (listId?: string): Reminder[] => {
        if (typeof window === 'undefined') return INITIAL_REMINDERS;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            let reminders: Reminder[] = saved ? JSON.parse(saved) : INITIAL_REMINDERS;

            if (listId) {
                reminders = reminders.filter(r => r.listId === listId);
            }

            return reminders;
        } catch (err) {
            console.warn('Failed to load reminders', err);
            return INITIAL_REMINDERS;
        }
    },

    saveReminders: (reminders: Reminder[]) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
            // Dispatch event for cross-component updates
            window.dispatchEvent(new Event('reminders-updated'));
        } catch (err) {
            console.warn('Failed to save reminders', err);
        }
    },

    addReminder: (reminder: Omit<Reminder, 'id'>) => {
        const reminders = remindersService.getReminders();
        const newReminder = { ...reminder, id: uuidv4() };
        remindersService.saveReminders([newReminder, ...reminders]);
        return newReminder;
    },

    updateReminder: (id: string, updates: Partial<Reminder>) => {
        const reminders = remindersService.getReminders();
        const updated = reminders.map(r => r.id === id ? { ...r, ...updates } : r);
        remindersService.saveReminders(updated);
    },

    deleteReminder: (id: string) => {
        const reminders = remindersService.getReminders();
        const updated = reminders.filter(r => r.id !== id);
        remindersService.saveReminders(updated);
    },

    deleteRemindersByListId: (listId: string) => {
        const reminders = remindersService.getReminders();
        const updated = reminders.filter(r => r.listId !== listId);
        remindersService.saveReminders(updated);
    },

    // List Management
    getLists: (): List[] => {
        if (typeof window === 'undefined') return INITIAL_LISTS;
        try {
            const saved = localStorage.getItem(LISTS_STORAGE_KEY);
            return saved ? JSON.parse(saved) : INITIAL_LISTS;
        } catch (err) {
            console.warn('Failed to load lists', err);
            return INITIAL_LISTS;
        }
    },

    saveLists: (lists: List[]) => {
        try {
            localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(lists));
            window.dispatchEvent(new Event('reminders-lists-updated'));
        } catch (err) {
            console.warn('Failed to save lists', err);
        }
    },

    addList: (list: Omit<List, 'id' | 'count'>) => {
        const lists = remindersService.getLists();
        const newList: List = { ...list, id: uuidv4(), count: 0 };
        remindersService.saveLists([...lists, newList]);
        return newList;
    },

    deleteList: (id: string) => {
        const lists = remindersService.getLists();
        const updated = lists.filter(l => l.id !== id);
        remindersService.saveLists(updated);
    },

    // Subscribe to changes
    subscribe: (callback: () => void) => {
        const handler = () => callback();
        window.addEventListener('reminders-updated', handler);
        window.addEventListener('reminders-lists-updated', handler);
        return () => {
            window.removeEventListener('reminders-updated', handler);
            window.removeEventListener('reminders-lists-updated', handler);
        };
    }
};
