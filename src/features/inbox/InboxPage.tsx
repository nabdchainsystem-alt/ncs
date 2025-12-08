import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Message } from './types';
import { USERS } from '../../constants';
import { messageService } from '../../features/inbox/messageService';
import { InboxSidebar } from './components/InboxSidebar';
import { MessageView } from './components/MessageView';
import { useToast } from '../../ui/Toast';

import { ComposeModal } from './components/ComposeModal';

import { authService } from '../../services/auth';

// ...

const InboxView: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [replyText, setReplyText] = useState('');
    const [filter, setFilter] = useState<'inbox' | 'sent'>('inbox');
    const { showToast } = useToast();
    const currentUser = authService.getCurrentUser();
    const [showCompose, setShowCompose] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);

    if (!currentUser) return <div>Please log in</div>;

    useEffect(() => {
        loadMessages();
        loadUsers();

        // Real-time subscription
        // Real-time subscription to Messages and Participants
        const channel = supabase
            .channel('inbox_updates')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'inbox_messages'
                },
                (payload) => {
                    console.log('Message update received:', payload);
                    loadMessages();
                    if (payload.eventType === 'INSERT') {
                        showToast('New message', 'info');
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'inbox_participants'
                },
                (payload) => {
                    console.log('Participant update received:', payload);
                    // If I am added to a conversation, I need to reload to fetch it
                    if (payload.new && (payload.new as any).user_id === currentUser.id) {
                        loadMessages();
                        showToast('New conversation', 'info');
                    }
                }
            )
            .subscribe((status) => {
                console.log('Inbox subscription status:', status);
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const loadUsers = async () => {
        const users = await authService.getUsers();
        setAvailableUsers(users);
    };

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
            await messageService.sendMessage(subject, replyText, recipientId, [], currentMsg.conversationId);
            setReplyText('');
            showToast('Reply sent!', 'success');
            loadMessages(); // Refresh to see sent message if we were displaying sent items
        } catch (e) {
            showToast('Failed to send', 'error');
        }
    };

    const selectedMessage = messages.find(m => m.id === selectedId);

    const handleDeleteMessage = async (id: string) => {
        try {
            await messageService.deleteMessage(id);
            setMessages(prev => prev.filter(m => m.id !== id));
            if (selectedId === id) setSelectedId(null);
            showToast('Message deleted', 'success');
        } catch (error) {
            showToast('Failed to delete message', 'error');
        }
    };

    return (
        <div className="flex h-full bg-transparent overflow-hidden animate-in fade-in duration-300 relative">
            <InboxSidebar
                isLoading={isLoading}
                messages={messages}
                selectedId={selectedId}
                filter={filter}
                currentUser={{ ...currentUser, email: currentUser.email || '' }}
                onLoadMessages={loadMessages}
                onSetFilter={setFilter}
                onSelectMessage={handleSelect}
                onDeleteMessage={handleDeleteMessage}
                onOpenCompose={() => setShowCompose(true)}
                users={availableUsers} // Pass users
            />
            <MessageView
                selectedMessage={selectedMessage}
                currentUser={{ ...currentUser, email: currentUser.email || '' }}
                replyText={replyText}
                onReplyChange={setReplyText}
                onSendReply={handleSendReply}
                onOpenCompose={() => setShowCompose(true)}
                onUpdateMessage={loadMessages}
                users={availableUsers} // Pass users
            />
            {showCompose && (
                <ComposeModal
                    isOpen={showCompose}
                    onClose={() => setShowCompose(false)}
                />
            )}
        </div>
    );
};

export default InboxView;