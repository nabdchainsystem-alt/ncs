import { Message } from './types';

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

    sendMessage: async (subject: string, content: string, recipientId: string, attachments: any[] = []): Promise<Message> => {
        const newMsg: Message = {
            id: `MSG-${Date.now()}`,
            senderId: 'u1', // Defaulting to Max for now, will be dynamic later
            recipientId,
            subject,
            preview: content.substring(0, 50) + '...',
            content,
            timestamp: new Date().toISOString(),
            isRead: false,
            tags: ['inbox'], // It should appear in inbox for the recipient
            attachments,
            tasks: [],
            notes: []
        };
        const res = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newMsg)
        });
        return res.json();
    },

    updateMessage: async (msgId: string, updates: Partial<Message>): Promise<Message> => {
        const res = await fetch(`${API_URL}/messages/${msgId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return res.json();
    }
};
