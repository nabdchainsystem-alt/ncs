import React from 'react';
import { Inbox, Loader2, MoreVertical, Search } from 'lucide-react';
import { Message } from '../types';
import { USERS } from '../../../constants';

interface InboxSidebarProps {
    isLoading: boolean;
    messages: Message[];
    selectedId: string | null;
    filter: 'inbox' | 'sent';
    onLoadMessages: () => void;
    onSetFilter: (filter: 'inbox' | 'sent') => void;
    onSelectMessage: (id: string) => void;
}

export const InboxSidebar: React.FC<InboxSidebarProps> = ({
    isLoading,
    messages,
    selectedId,
    filter,
    onLoadMessages,
    onSetFilter,
    onSelectMessage
}) => {
    const filteredMessages = messages; // In a real app, verify tags: m.tags.includes(filter)

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
        <div className="w-96 border-r border-gray-200 flex flex-col bg-gray-50/50">
            {/* Toolbar */}
            <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
                <h2 className="font-bold text-lg flex items-center text-gray-700">
                    <Inbox className="mr-2 text-clickup-purple" size={20} />
                    Inbox
                </h2>
                <div className="flex space-x-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500" onClick={onLoadMessages}>
                        <Loader2 size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500">
                        <MoreVertical size={16} />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-clickup-purple"
                    />
                </div>
            </div>

            {/* Filters (Tabs) */}
            <div className="flex px-3 border-b border-gray-200 bg-white">
                <button
                    onClick={() => onSetFilter('inbox')}
                    className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${filter === 'inbox' ? 'border-clickup-purple text-clickup-purple' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Primary
                </button>
                <button
                    onClick={() => onSetFilter('sent')}
                    className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${filter === 'sent' ? 'border-clickup-purple text-clickup-purple' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Updates
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading && messages.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
                ) : filteredMessages.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">No messages here.</div>
                ) : (
                    filteredMessages.map(msg => {
                        const sender = getSender(msg.senderId);
                        return (
                            <div
                                key={msg.id}
                                onClick={() => onSelectMessage(msg.id)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors group relative ${selectedId === msg.id ? 'bg-purple-50 border-purple-100' : 'bg-white hover:bg-gray-50'
                                    } ${!msg.isRead ? 'bg-gray-50' : ''}`}
                            >
                                {!msg.isRead && (
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-clickup-purple rounded-full"></div>
                                )}
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center space-x-2">
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                            style={{ backgroundColor: sender.color }}
                                        >
                                            {sender.avatar}
                                        </div>
                                        <span className={`text-sm truncate max-w-[120px] ${!msg.isRead ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                                            {sender.name}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">{formatDate(msg.timestamp)}</span>
                                </div>
                                <div className={`text-sm mb-1 truncate ${!msg.isRead ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>
                                    {msg.subject}
                                </div>
                                <div className="text-xs text-gray-400 truncate">
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
