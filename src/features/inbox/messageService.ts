import { Message } from './types';
import { supabase, getCompanyId } from '../../lib/supabase';
import { authService } from '../../services/auth';

export const messageService = {
    getMessages: async (): Promise<Message[]> => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return [];

        const { data, error } = await supabase
            .from('inbox_messages')
            .select('*')
            .or(`recipient_id.eq.${currentUser.id},sender_id.eq.${currentUser.id}`);

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }

        // Map DB fields to Message type
        return data.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id,
            recipientId: msg.recipient_id,
            subject: msg.subject,
            content: msg.content,
            preview: msg.preview,
            timestamp: msg.timestamp,
            isRead: msg.is_read,
            tags: msg.tags || [],
            attachments: [], // Not supported in DB yet
            tasks: [],
            notes: []
        }));
    },

    markMessageRead: async (msgId: string): Promise<void> => {
        await supabase
            .from('inbox_messages')
            .update({ is_read: true })
            .eq('id', msgId);
    },

    sendMessage: async (subject: string, content: string, recipientId: string, attachments: any[] = []): Promise<Message> => {
        const currentUser = authService.getCurrentUser();
        const newMessage = {
            id: `MSG-${Date.now()}`,
            sender_id: currentUser?.id,
            recipient_id: recipientId,
            subject,
            content,
            preview: content.substring(0, 50) + '...',
            timestamp: new Date().toISOString(),
            is_read: false,
            tags: ['inbox'],
            company_id: getCompanyId()
        };

        const { data, error } = await supabase
            .from('inbox_messages')
            .insert(newMessage)
            .select()
            .single();

        if (error) throw error;

        return {
            id: data.id,
            senderId: data.sender_id,
            recipientId: data.recipient_id,
            subject: data.subject,
            content: data.content,
            preview: data.preview,
            timestamp: data.timestamp,
            isRead: data.is_read,
            tags: data.tags || [],
            attachments: [],
            tasks: [],
            notes: []
        };
    },

    deleteMessage: async (msgId: string): Promise<void> => {
        await supabase
            .from('inbox_messages')
            .delete()
            .eq('id', msgId);
    }
};
