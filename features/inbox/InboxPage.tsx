import React, { useState, useEffect } from 'react';
import { Message } from './types';
import { USERS } from '../../constants';
import { messageService } from '../../features/inbox/messageService';
import { InboxSidebar } from './components/InboxSidebar';
import { MessageView } from './components/MessageView';
import { useToast } from '../../ui/Toast';

const InboxView: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [filter, setFilter] = useState<'inbox' | 'sent'>('inbox');
    const { showToast } = useToast();

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        setIsLoading(true);
        try {
            const data = await messageService.getMessages();
            // Sort by date desc
            setMessages(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = async (id: string) => {
        setSelectedId(id);
        const msg = messages.find(m => m.id === id);
        if (msg && !msg.isRead) {
            // Optimistic update
            setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
            await messageService.markMessageRead(id);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;

        const currentMsg = messages.find(m => m.id === selectedId);
        const subject = currentMsg ? `Re: ${currentMsg.subject}` : 'New Message';

        showToast('Sending...', 'info');
        try {
            await messageService.sendMessage(subject, replyText);
            setReplyText('');
            showToast('Reply sent!', 'success');
            loadMessages(); // Refresh to see sent message if we were displaying sent items
        } catch (e) {
            showToast('Failed to send', 'error');
        }
    };

    const selectedMessage = messages.find(m => m.id === selectedId);
    const filteredMessages = messages; // In a real app, verify tags: m.tags.includes(filter)

    return (
        <div className="flex h-full bg-white overflow-hidden animate-in fade-in duration-300">
            <InboxSidebar
                isLoading={isLoading}
                messages={messages}
                selectedId={selectedId}
                filter={filter}
                onLoadMessages={loadMessages}
                onSetFilter={setFilter}
                onSelectMessage={handleSelect}
            />
            <MessageView
                selectedMessage={selectedMessage}
                replyText={replyText}
                onReplyChange={setReplyText}
                onSendReply={handleSendReply}
                onOpenCompose={() => showToast('Compose Window Opened', 'info')}
            />
        </div>
    );
};

export default InboxView;