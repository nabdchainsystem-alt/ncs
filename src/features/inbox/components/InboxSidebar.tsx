import React from 'react';
import { Inbox, Loader2, MoreVertical, Search } from 'lucide-react';
import { Message } from '../types';
import { USERS } from '../../../constants';

interface InboxSidebarProps {
    isLoading: boolean;
    messages: Message[];
    selectedId: string | null;
    filter: 'inbox' | 'sent';
    currentUser: { id: string; name: string; email: string };
    onLoadMessages: () => void;
    onSetFilter: (filter: 'inbox' | 'sent') => void;
    onSelectMessage: (id: string) => void;

}

export const InboxSidebar: React.FC<InboxSidebarProps> = ({
    isLoading,
    messages,
    selectedId,
    filter,
    currentUser,
    onLoadMessages,
    onSetFilter,
    onSelectMessage
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

    return (
        <div className="w-80 border-r border-gray-200/60 flex flex-col bg-gray-50/80 backdrop-blur-xl h-full">
            {/* Header Area */}
            <div className="p-5 pb-2 flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-2xl text-gray-900 tracking-tight flex items-center">
                        Inbox
                        {messages.filter(m => !m.isRead && m.recipientId === currentUser.id).length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-black text-white text-[10px] font-bold rounded-full">
                                {messages.filter(m => !m.isRead && m.recipientId === currentUser.id).length}
                            </span>
                        )}
                    </h2>
                    <div className="flex items-center space-x-1">
                        <button
                            className="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-400 hover:text-gray-900 transition-all duration-200"
                            onClick={onLoadMessages}
                        >
                            <Loader2 size={16} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border-none shadow-sm rounded-xl text-sm placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                </div>

                {/* Segmented Control */}
                <div className="flex p-1 bg-gray-200/50 rounded-lg">
                    <button
                        onClick={() => onSetFilter('inbox')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${filter === 'inbox' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Inbox
                    </button>
                    <button
                        onClick={() => onSetFilter('sent')}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${filter === 'sent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Sent
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-3 space-y-1">
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
                        return (
                            <div
                                key={msg.id}
                                onClick={() => onSelectMessage(msg.id)}
                                className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative border ${isSelected
                                    ? 'bg-white border-gray-200 shadow-sm ring-1 ring-black/5'
                                    : 'bg-transparent border-transparent hover:bg-white/60 hover:border-gray-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-0.5">
                                    <div className="flex items-center space-x-2">
                                        <div className="relative">
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
                                                style={{ backgroundColor: sender.color }}
                                            >
                                                {sender.avatar}
                                            </div>
                                            {!msg.isRead && filter === 'inbox' && (
                                                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 border-2 border-white rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className={`text-xs leading-none truncate ${!msg.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {sender.name}
                                            </span>
                                            <span className="text-[10px] text-gray-400 mt-0.5 font-medium">{formatDate(msg.timestamp)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={`text-xs mb-0.5 truncate leading-tight ${!msg.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                    {msg.subject}
                                </div>
                                <div className="text-[10px] text-gray-400 truncate leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                    {msg.preview}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
