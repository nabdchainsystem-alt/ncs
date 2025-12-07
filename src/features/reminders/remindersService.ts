import { v4 as uuidv4 } from 'uuid';
import { supabase, getCompanyId } from '../../lib/supabase';

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

// Initial Lists for seeding if empty (will only run if no lists found in DB)
const INITIAL_LISTS: List[] = [
    { id: 'work', name: 'Work Projects', type: 'project', count: 0, color: 'text-black' },
    { id: 'personal', name: 'Personal', type: 'project', count: 0, color: 'text-black' },
    { id: 'shopping', name: 'Shopping', type: 'project', count: 0, color: 'text-black' },
];

export const remindersService = {
    getReminders: async (listId?: string): Promise<Reminder[]> => {
        const companyId = getCompanyId();
        let query = supabase
            .from('reminders')
            .select('*')
            .eq('company_id', companyId);

        if (listId) {
            query = query.eq('list_id', listId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching reminders:', error);
            return [];
        }

        // Map snake_case DB to camelCase JS if needed, but we used camelCase in DB creation for some fields?
        // Wait, SQL used snake_case for columns like due_date, list_id.
        // We need to map them.
        return (data || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            notes: r.notes,
            dueDate: r.due_date,
            secondaryDueDate: r.secondary_due_date,
            time: r.time,
            priority: r.priority,
            listId: r.list_id,
            tags: r.tags || [],
            completed: r.completed,
            subtasks: r.subtasks || [],
            company_id: r.company_id
        }));
    },

    addReminder: async (reminder: Omit<Reminder, 'id'>) => {
        const companyId = getCompanyId();
        const newReminder = {
            title: reminder.title,
            notes: reminder.notes,
            due_date: reminder.dueDate,
            secondary_due_date: reminder.secondaryDueDate,
            time: reminder.time,
            priority: reminder.priority,
            list_id: reminder.listId,
            tags: reminder.tags,
            completed: reminder.completed,
            subtasks: reminder.subtasks,
            company_id: companyId
        };
        const { data, error } = await supabase
            .from('reminders')
            .insert(newReminder)
            .select()
            .single();

        if (error) {
            console.error('Error adding reminder:', error);
            throw error;
        }

        window.dispatchEvent(new Event('reminders-updated'));

        // Return mapped object
        return {
            ...reminder,
            id: data.id
        } as Reminder;
    },

    updateReminder: async (id: string, updates: Partial<Reminder>) => {
        // Map updates to snake_case
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
        if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
        if (updates.secondaryDueDate !== undefined) dbUpdates.secondary_due_date = updates.secondaryDueDate;
        if (updates.time !== undefined) dbUpdates.time = updates.time;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.listId !== undefined) dbUpdates.list_id = updates.listId;
        if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
        if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
        if (updates.subtasks !== undefined) dbUpdates.subtasks = updates.subtasks;

        const { error } = await supabase
            .from('reminders')
            .update(dbUpdates)
            .eq('id', id);

        if (error) {
            console.error('Error updating reminder:', error);
            return;
        }
        window.dispatchEvent(new Event('reminders-updated'));
    },

    deleteReminder: async (id: string) => {
        const { error } = await supabase.from('reminders').delete().eq('id', id);
        if (error) console.error('Error deleting reminder:', error);
        window.dispatchEvent(new Event('reminders-updated'));
    },

    deleteRemindersByListId: async (listId: string) => {
        const { error } = await supabase.from('reminders').delete().eq('list_id', listId);
        if (error) console.error('Error deleting reminders by list:', error);
        window.dispatchEvent(new Event('reminders-updated'));
    },

    // List Management
    getLists: async (): Promise<List[]> => {
        const companyId = getCompanyId();
        const { data, error } = await supabase
            .from('reminder_lists')
            .select('*')
            .eq('company_id', companyId);

        if (error) {
            console.error('Error fetching lists:', error);
            return [];
        }

        // If no lists and we expect some, maybe seed? 
        // For now, if empty, return empty (or we could auto-seed).
        // Let's rely on the user running seeding or manual creation.

        return (data || []).map((l: any) => ({
            id: l.id,
            name: l.name,
            type: l.type as any,
            icon: l.icon,
            count: l.count,
            color: l.color,
            company_id: l.company_id
        }));
    },

    addList: async (list: Omit<List, 'id' | 'count'>) => {
        const companyId = getCompanyId();
        // Generate a random ID if we want, or let UUID default if table column was UUID.
        // But table DDL says 'id text primary key'. So we must provide it.
        const id = uuidv4();

        const newList = {
            id,
            name: list.name,
            type: list.type,
            icon: list.icon,
            count: 0,
            color: list.color,
            company_id: companyId
        };

        const { error } = await supabase
            .from('reminder_lists')
            .insert(newList);

        if (error) {
            console.error('Error adding list:', error);
            throw error;
        }
        window.dispatchEvent(new Event('reminders-lists-updated'));
        return { ...list, id, count: 0 } as List;
    },

    deleteList: async (id: string) => {
        const { error } = await supabase.from('reminder_lists').delete().eq('id', id);
        if (error) console.error('Error deleting list:', error);
        window.dispatchEvent(new Event('reminders-lists-updated'));
    },

    // Subscribe to changes (Manual Event Trigger)
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
