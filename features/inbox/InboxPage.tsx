import React, { useState, useEffect } from 'react';
import { Message } from './types';
import { USERS } from '../../constants';
import { messageService } from '../../features/inbox/messageService';
import { InboxSidebar } from './components/InboxSidebar';
import { MessageView } from './components/MessageView';
import { useToast } from '../../ui/Toast';

import { ComposeModal } from './components/ComposeModal';

const InboxView: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [filter, setFilter] = useState<'inbox' | 'sent'>('inbox');
    const { showToast } = useToast();
    const currentUser = USERS['u1'];
    const [showCompose, setShowCompose] = useState(false);

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
        if (msg && !msg.isRead && msg.recipientId === currentUser.id) {
            // Optimistic update
            setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
            await messageService.markMessageRead(id);
        }
    };



    const handleSendReply = async () => {
        if (!replyText.trim()) return;

        const currentMsg = messages.find(m => m.id === selectedId);
        if (!currentMsg) return;

        const subject = `Re: ${currentMsg.subject}`;
        const recipientId = currentMsg.senderId === currentUser.id ? currentMsg.recipientId : currentMsg.senderId;

        showToast('Sending...', 'info');
        try {
            await messageService.sendMessage(subject, replyText, recipientId);
            setReplyText('');
            showToast('Reply sent!', 'success');
            loadMessages(); // Refresh to see sent message if we were displaying sent items
        } catch (e) {
            showToast('Failed to send', 'error');
        }
    };

    const selectedMessage = messages.find(m => m.id === selectedId);

    return (
        <div className="flex h-full bg-white overflow-hidden animate-in fade-in duration-300 relative">
            <InboxSidebar
                isLoading={isLoading}
                messages={messages}
                selectedId={selectedId}
                filter={filter}
                currentUser={currentUser}
                onLoadMessages={loadMessages}
                onSetFilter={setFilter}
                onSelectMessage={handleSelect}
            />
            <MessageView
                selectedMessage={selectedMessage}
                currentUser={currentUser}
                replyText={replyText}
                onReplyChange={setReplyText}
                onSendReply={handleSendReply}
                onOpenCompose={() => setShowCompose(true)}
                onUpdateMessage={loadMessages}
            />
            {showCompose && (
                <ComposeModal
                    currentUser={currentUser}
                    onClose={() => setShowCompose(false)}
                    onSend={() => {
                        showToast('Message sent!', 'success');
                        loadMessages();
                    }}
                />
            )}
        </div>
    );
};

export default InboxView;