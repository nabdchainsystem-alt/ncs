import { Message } from './types';
import { supabase, getCompanyId } from '../../lib/supabase';
import { authService } from '../../services/auth';

export const messageService = {
    // Fetch all messages for the current user by joining conversations they are in
    getMessages: async (): Promise<Message[]> => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return [];

        // 1. Get conversations I am a participant in
        const { data: myConversations, error: convError } = await supabase
            .from('inbox_participants')
            .select('conversation_id')
            .eq('user_id', currentUser.id);

        if (convError || !myConversations || myConversations.length === 0) return [];

        const conversationIds = myConversations.map(c => c.conversation_id);

        // 2. Fetch messages for these conversations
        // We also fetch all participants to determine the "other" person (recipient)
        const { data: messages, error: msgError } = await supabase
            .from('inbox_messages')
            .select(`
                *,
                inbox_conversations (
                    subject,
                    inbox_participants (
                        user_id
                    )
                )
            `)
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false });

        if (msgError) {
            console.error('Error fetching messages:', msgError);
            return [];
        }

        return (messages || []).map((msg: any) => {
            // Determine the "Recipient" for UI display purposes
            let calculatedRecipientId = 'group';

            if (msg.sender_id === currentUser.id) {
                // If I am the sender, the recipient is the other participant
                const participants = msg.inbox_conversations?.inbox_participants || [];
                const otherParticipant = participants.find((p: any) => p.user_id !== currentUser.id);
                calculatedRecipientId = otherParticipant ? otherParticipant.user_id : 'group';
            } else {
                // If I am NOT the sender, I am the recipient (for 1-on-1 logic)
                calculatedRecipientId = currentUser.id;
            }

            return {
                id: msg.id,
                senderId: msg.sender_id,
                recipientId: calculatedRecipientId,
                subject: msg.inbox_conversations?.subject || '(No Subject)',
                content: msg.content,
                preview: msg.content.substring(0, 50) + '...',
                timestamp: msg.created_at,
                isRead: false, // In a future update, check inbox_participants.is_read
                tags: [],
                attachments: msg.attachments || [],
                tasks: [],
                notes: []
            };
        });
    },

    markMessageRead: async (msgId: string): Promise<void> => {
        // In Pro model, read status is on the CONVERSATION for the PARTICIPANT.
        // But existing UI calls this on a message.
        // We'll stub this or try to find the conversation and update participant status?
        // Let's trying to find the conversation for this message.
        const { data } = await supabase.from('inbox_messages').select('conversation_id').eq('id', msgId).single();
        if (data && authService.getCurrentUser()) {
            await supabase
                .from('inbox_participants')
                .update({ is_read: true })
                .eq('conversation_id', data.conversation_id)
                .eq('user_id', authService.getCurrentUser()?.id);
        }
    },

    sendMessage: async (subject: string, content: string, recipientId: string, attachments: any[] = []): Promise<Message> => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) throw new Error("Not logged in");

        // 1. Create Conversation
        const { data: conversation, error: convError } = await supabase
            .from('inbox_conversations')
            .insert({
                subject,
                last_message_preview: content.substring(0, 50),
                company_id: getCompanyId()
            })
            .select()
            .single();

        if (convError) throw convError;

        // 2. Add Participants (Sender + Recipient)
        const participants = [
            { conversation_id: conversation.id, user_id: currentUser.id, is_read: true, company_id: getCompanyId() },
            { conversation_id: conversation.id, user_id: recipientId, is_read: false, company_id: getCompanyId() } // We don't know recipient's company but we can guess or leave null. Safest to use current company or omit.
            // If we omit company_id for recipient, it's fine, the table has it but RLS might rely on it?
            // Policies rely on user_id, so company_id is just metadata. I'll include it for now.
        ];

        const { error: partError } = await supabase.from('inbox_participants').insert(participants);
        if (partError) throw partError;

        // 3. Create Message
        const newMessage = {
            conversation_id: conversation.id,
            sender_id: currentUser.id,
            content,
            attachments, // JSONB
            company_id: getCompanyId()
        };

        const { data: message, error: msgError } = await supabase
            .from('inbox_messages')
            .insert(newMessage)
            .select()
            .single();

        if (msgError) throw msgError;

        return {
            id: message.id,
            senderId: message.sender_id,
            recipientId: recipientId, // For UI return
            subject: subject,
            content: message.content,
            preview: message.content.substring(0, 50),
            timestamp: message.created_at,
            isRead: true,
            tags: [],
            attachments: message.attachments || [],
            tasks: [],
            notes: []
        };
    },

    deleteMessage: async (msgId: string): Promise<void> => {
        // Actually delete the message
        await supabase
            .from('inbox_messages')
            .delete()
            .eq('id', msgId);
    }
};
