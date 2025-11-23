import { USERS } from '../../constants';

const API_URL = 'http://localhost:3001';

export interface Message {
    id: string;
    sender: string;
    senderId?: string;
    content: string;
    timestamp: string; // JSON server stores dates as strings
    avatar?: string;
    channelId: string;
}

export interface Channel {
    id: string;
    name: string;
    type: 'public' | 'private';
    participants?: string[];
}

export const discussionService = {
    getChannels: async (): Promise<Channel[]> => {
        try {
            const res = await fetch(`${API_URL}/channels`);
            if (!res.ok) throw new Error('Failed to fetch channels');
            return res.json();
        } catch (error) {
            console.error('Error fetching channels:', error);
            return [];
        }
    },

    createChannel: async (name: string, participants: string[]): Promise<Channel> => {
        const newChannel: Channel = {
            id: Date.now().toString(),
            name,
            type: 'public',
            participants
        };

        const res = await fetch(`${API_URL}/channels`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newChannel)
        });
        return res.json();
    },

    deleteChannel: async (channelId: string): Promise<void> => {
        await fetch(`${API_URL}/channels/${channelId}`, {
            method: 'DELETE',
        });
    },

    getMessages: async (channelId: string): Promise<Message[]> => {
        try {
            const res = await fetch(`${API_URL}/discussion_messages?channelId=${channelId}`);
            if (!res.ok) throw new Error('Failed to fetch messages');
            return res.json();
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    },

    sendMessage: async (channelId: string, content: string, senderId: string = 'me'): Promise<Message> => {
        const user = Object.values(USERS).find(u => u.id === senderId) || USERS['me'];

        const newMessage: Message = {
            id: Date.now().toString(),
            sender: user.name,
            senderId: user.id,
            content,
            timestamp: new Date().toISOString(),
            avatar: user.avatar,
            channelId
        };

        const res = await fetch(`${API_URL}/discussion_messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMessage)
        });
        return res.json();
    }
};
