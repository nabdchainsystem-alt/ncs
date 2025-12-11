import { supabase } from '../../lib/supabase';
import { Email } from './types';

export const mailService = {
    async fetchEmails(folder: string = 'inbox'): Promise<Email[]> {
        const { data, error } = await supabase
            .from('emails')
            .select('*')
            .eq('folder', folder)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching emails:', error);
            // Return empty array or throw error depending on error handling strategy
            return [];
        }

        return data as Email[];
    },

    async fetchAllEmails(): Promise<Email[]> {
        const { data, error } = await supabase
            .from('emails')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all emails:', error);
            return [];
        }
        return data as Email[];
    },

    async sendEmail(email: Omit<Email, 'id' | 'created_at' | 'time'>): Promise<Email | null> {
        // Mocking 'time' relative to now for display purposes
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // 1. Create the "Sent" copy (for the sender)
        const sentCopy = {
            ...email,
            folder: 'sent',
            time: timeString,
            read: true,
        };

        // 2. Create the "Inbox" copy (for the recipient)
        const inboxCopy = {
            ...email,
            folder: 'inbox',
            time: timeString,
            read: false,
        };

        // Perform parallel inserts
        const [sentRes, inboxRes] = await Promise.all([
            supabase.from('emails').insert([sentCopy]).select().single(),
            supabase.from('emails').insert([inboxCopy]).select().single()
        ]);

        if (sentRes.error) {
            console.error('Error saving sent email:', sentRes.error);
            return null;
        }

        if (inboxRes.error) {
            console.error('Error delivering to inbox:', inboxRes.error);
            // We still return the sent copy as success from sender's perspective
        }

        return sentRes.data as Email;
    },

    async updateEmail(id: number, updates: Partial<Email>): Promise<Email | null> {
        const { data, error } = await supabase
            .from('emails')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating email:', error);
            return null;
        }

        return data as Email;
    },

    async deleteEmail(id: number): Promise<boolean> {
        const { error } = await supabase
            .from('emails')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting email:', error);
            return false;
        }
        return true;
    }
};
