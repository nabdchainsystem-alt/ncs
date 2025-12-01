import { v4 as uuidv4 } from 'uuid';

export interface Reminder {
    id: string;
    title: string;
    notes?: string;
    dueDate?: string; // ISO date or 'Today', 'Tomorrow'
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

export const remindersService = {
    getReminders: (): Reminder[] => {
        if (typeof window === 'undefined') return INITIAL_REMINDERS;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : INITIAL_REMINDERS;
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

    // Subscribe to changes
    subscribe: (callback: () => void) => {
        window.addEventListener('reminders-updated', callback);
        return () => window.removeEventListener('reminders-updated', callback);
    }
};
