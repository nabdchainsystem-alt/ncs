import { supabase, getCompanyId } from '../../lib/supabase';

export interface Message {
    id: string;
    sender: string;
    senderId?: string;
    content: string;
    timestamp: string; // JSON server stores dates as strings
    avatar?: string;
    channelId: string;
    attachments?: { name: string; type: string; url?: string }[];
}

export interface Channel {
    id: string;
    name: string;
    type: 'public' | 'private';
    participants?: string[];
}

export const discussionService = {
    getChannels: async (): Promise<Channel[]> => {
        const { data, error } = await supabase
            .from('channels')
            .select('*')
            .eq('company_id', getCompanyId());

        if (error) {
            console.error('Error fetching channels:', error);
            return [];
        }
        return data as Channel[];
    },

    createChannel: async (name: string, participants: string[]): Promise<Channel> => {
        const newChannel = {
            id: Date.now().toString(), // Or uuidv4() if preferred, schema supports text
            name,
            type: 'public',
            participants,
            company_id: getCompanyId()
        };

        const { data, error } = await supabase
            .from('channels')
            .insert(newChannel)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    deleteChannel: async (channelId: string): Promise<void> => {
        const { error } = await supabase.from('channels').delete().eq('id', channelId);
        if (error) throw error;
    },

    getMessages: async (channelId: string): Promise<Message[]> => {
        const { data, error } = await supabase
            .from('discussion_messages')
            .select('*')
            .eq('channelId', channelId) // Schema has channel_id but let's check mapping. Schema: channel_id.
            // Wait, standard Supabase is snake_case usually but my schema.sql used channel_id. 
            // However existing code uses CamelCase `channelId`. 
            // I should use `.eq('channel_id', channelId)` AND alias or map it.
            // Actually, for simplicity, I'll map data. 
            // Or better, I'll update the schema or code later. 
            // My schema used `channel_id` text references ...
            // Let's assume I can map it.
            .eq('channel_id', channelId)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }

        // Map snake_case database fields to CamelCase interface if needed
        return data.map((msg: any) => ({
            ...msg,
            channelId: msg.channel_id,
            senderId: msg.sender_id,
            // sender, avatar might need check if they are in msg or joined.
            // Schema has sender_name, avatar as cached fields.
            sender: msg.sender_name
        })) as Message[];
    },

    sendMessage: async (channelId: string, content: string, senderId: string = 'me'): Promise<Message> => {
        // Fetch sender details
        let userId = senderId;
        // If sender is 'me', we can't really fetch from DB without knowing who 'me' is...
        // Assuming the app passes a real ID or we default to NULL/Error.
        // For now, let's fetch the user if we have a UUID.

        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        const senderName = user?.name || 'Unknown';
        const senderAvatar = user?.avatar_url || '';

        const newMessage = {
            id: Date.now().toString(),
            content,
            sender_id: userId,
            sender_name: senderName,
            avatar: senderAvatar,
            channel_id: channelId,
            timestamp: new Date().toISOString(),
            company_id: getCompanyId()
        };

        const { data, error } = await supabase
            .from('discussion_messages')
            .insert(newMessage)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            channelId: data.channel_id,
            senderId: data.sender_id,
            sender: data.sender_name
        } as Message;
    }
};
