export interface Message {
    id: string;
    senderId: string;
    subject: string;
    preview: string;
    content: string;
    timestamp: string;
    isRead: boolean;
    tags: ('inbox' | 'sent' | 'archived')[];
}
