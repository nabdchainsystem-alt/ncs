import React from 'react';
import { Inbox, Loader2, MoreVertical, Search, Trash2 } from 'lucide-react';
import { Message } from '../types';
import { USERS } from '../../../constants';
import { ConfirmModal } from '../../../ui/ConfirmModal';

interface InboxSidebarProps {
    isLoading: boolean;
    messages: Message[];
    selectedId: string | null;
    filter: 'inbox' | 'sent';
    currentUser: { id: string; name: string; email: string };
    onLoadMessages: () => void;
    onSetFilter: (filter: 'inbox' | 'sent') => void;
    onSelectMessage: (id: string) => void;
    onDeleteMessage?: (id: string) => void;
}

export const InboxSidebar: React.FC<InboxSidebarProps> = ({
    isLoading,
    messages,
    selectedId,
    filter,
    currentUser,
    onLoadMessages,
    onSetFilter,
    onSelectMessage,
    onDeleteMessage
}) => {
    const filteredMessages = messages.filter(msg => {
        if (filter === 'inbox') {
            return msg.recipientId === currentUser.id && !msg.tags.includes('archived');
        } else {
            return msg.senderId === currentUser.id;
        }
    });

    const getSender = (id: string) => USERS[id as keyof typeof USERS] || { name: 'Unknown', color: '#999', avatar: '?' };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const [messageToDelete, setMessageToDelete] = React.useState<string | null>(null);

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setMessageToDelete(id);
    };

    const confirmDelete = () => {
        if (messageToDelete) {
            onDeleteMessage?.(messageToDelete);
            setMessageToDelete(null);
        }
    };

    return (
        <div className="w-80 border-r border-gray-200/60 flex flex-col bg-gray-50/80 backdrop-blur-xl h-full">
            {/* Header Area */}
            <div className="p-4 pb-2 flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-xl text-gray-900 tracking-tight flex items-center">
                        Inbox
                        {messages.filter(m => !m.isRead && m.recipientId === currentUser.id).length > 0 && (
                            <span className="ml-2 px-1.5 py-0.5 bg-black text-white text-[10px] font-bold rounded-full">
                                {messages.filter(m => !m.isRead && m.recipientId === currentUser.id).length}
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center space-x-2">
                        <button
                            className="p-1.5 hover:bg-white hover:shadow-sm rounded-md text-gray-400 hover:text-gray-900 transition-all duration-200"
                            onClick={onLoadMessages}
                            title="Refresh"
                        >
                            <Loader2 size={14} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm hover:shadow transition-all duration-200"
                            style={{ backgroundColor: '#1e2126' }}
                            onClick={() => {
                                // TODO: Open compose modal
                            }}
                        >
                            <span className="text-lg leading-none mb-0.5">+</span>
                            <span>Compose</span>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        className="w-full pl-9 pr-4 py-2 bg-white border-none shadow-sm rounded-lg text-xs placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                </div>

                {/* Segmented Control */}
                <div className="flex p-1 bg-gray-200/50 rounded-lg">
                    <button
                        onClick={() => onSetFilter('inbox')}
                        className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${filter === 'inbox' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Inbox
                    </button>
                    <button
                        onClick={() => onSetFilter('sent')}
                        className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all duration-200 ${filter === 'sent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Sent
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 space-y-0.5">
                {isLoading && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 space-y-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs font-medium">Syncing...</span>
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
                        <Inbox size={32} className="opacity-20" />
                        <span className="text-sm font-medium">All caught up</span>
                    </div>
                ) : (
                    filteredMessages.map(msg => {
                        const sender = getSender(msg.senderId);
                        const isSelected = selectedId === msg.id;
                        // Use #1e2126 for sent messages avatar, otherwise sender's color
                        const avatarColor = filter === 'sent' ? '#1e2126' : sender.color;

                        return (
                            <div
                                key={msg.id}
                                onClick={() => onSelectMessage(msg.id)}
                                className={`group relative py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 border ${isSelected
                                    ? 'bg-white border-gray-200 shadow-sm ring-1 ring-black/5'
                                    : 'bg-transparent border-transparent hover:bg-white/60 hover:border-gray-100'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Avatar */}
                                    <div className="relative flex-shrink-0 mt-0.5">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white overflow-hidden"
                                            style={{ backgroundColor: sender.avatar.startsWith('/') ? 'transparent' : avatarColor }}
                                        >
                                            {sender.avatar.startsWith('/') ? (
                                                <img src={sender.avatar} alt={sender.name} className="w-full h-full object-cover" />
                                            ) : (
                                                sender.avatar
                                            )}
                                        </div>
                                        {!msg.isRead && filter === 'inbox' && (
                                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 border-2 border-white rounded-full ring-1 ring-blue-500/20"></div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <span className={`text-xs truncate pr-2 ${!msg.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                {msg.subject}
                                            </span>
                                            <span className={`text-[10px] flex-shrink-0 ${!msg.isRead ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                                                {formatDate(msg.timestamp)}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-400 truncate leading-relaxed">
                                            {msg.preview}
                                        </div>
                                    </div>
                                </div>

                                {/* Delete Button (Visible on Hover) */}
                                <button
                                    className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 p-1 transition-all z-10 hover:scale-110"
                                    onClick={(e) => handleDeleteClick(e, msg.id)}
                                    title="Delete"
                                >
                                    <Trash2 size={11} color="#1e2126" />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            <ConfirmModal
                isOpen={!!messageToDelete}
                onClose={() => setMessageToDelete(null)}
                onConfirm={confirmDelete}
                title="Delete Message"
                message="Are you sure you want to delete this message? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};
