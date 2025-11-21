import { Message } from '../../types';

const API_URL = 'http://localhost:3001';

export const messageService = {
    getMessages: async (): Promise<Message[]> => {
        const res = await fetch(`${API_URL}/messages`);
        return res.json();
    },

    markMessageRead: async (msgId: string): Promise<void> => {
        await fetch(`${API_URL}/messages/${msgId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isRead: true })
        });
    },

    sendMessage: async (subject: string, content: string): Promise<Message> => {
        const newMsg: Message = {
            id: `MSG-${Date.now()}`,
            senderId: 'me',
            subject,
            preview: content.substring(0, 50) + '...',
            content,
            timestamp: new Date().toISOString(),
            isRead: true,
            tags: ['sent']
        };
        const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMsg)
        });
        return res.json();
    }
};
