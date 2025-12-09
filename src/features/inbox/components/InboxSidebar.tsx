import React from 'react';
import { Inbox, Loader2, MoreVertical, Search, Trash2, Plus } from 'lucide-react';
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
    onOpenCompose: () => void;
    users?: any[];
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
    onDeleteMessage,
    onOpenCompose,
    users = []
}) => {
    // Display individual messages instead of grouping by conversation
    const filteredMessages = messages.filter(msg => {
        if (filter === 'inbox') {
            // Inbox shows all non-archived messages
            return !msg.tags.includes('archived');
        } else {
            // Sent shows messages I sent
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
        <div className="w-64 bg-stone-50/50 border-r border-stone-200 flex flex-col h-full">
            {/* Header Area - Matches Discussion */}
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 flex-shrink-0 bg-stone-50/50">
                <div className="flex items-center gap-2">
                    <h2 className="font-bold text-gray-800">Inbox</h2>
                    {filteredMessages.filter(m => !m.isRead && m.recipientId === currentUser.id).length > 0 && (
                        <span className="px-1.5 py-0.5 bg-black text-white text-[10px] font-bold rounded-full">
                            {filteredMessages.filter(m => !m.isRead && m.recipientId === currentUser.id).length}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-1">
                    <button
                        className="p-1 hover:bg-gray-200 rounded-md text-gray-500 transition-colors"
                        onClick={onLoadMessages}
                        title="Refresh"
                    >
                        <Loader2 size={16} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={onOpenCompose}
                        className="p-1 hover:bg-gray-200 rounded-md text-gray-500 transition-colors"
                        title="Compose"
                    >
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            {/* Search - Matches Discussion */}
            <div className="p-4 pb-2">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 focus:border-black focus:ring-0 rounded-xl text-sm transition-all placeholder-gray-500"
                    />
                </div>
            </div>

            {/* Segmented Control - Standardized */}
            <div className="px-4 pb-2">
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

            <div className="flex-1 overflow-y-auto custom-scrollbar px-2 pb-2 space-y-0.5">
                {isLoading && messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400 space-y-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs font-medium">Syncing...</span>
                    </div>
                ) : (
                    (() => {
                        // Group messages by conversation logic
                        const conversations = messages.reduce((acc, msg) => {
                            // Filter logic here to ensure groups respect the current tab
                            const isValid = filter === 'inbox'
                                ? !msg.tags.includes('archived')
                                : msg.senderId === currentUser.id;

                            if (isValid) {
                                const key = msg.conversationId || msg.id;
                                if (!acc[key]) acc[key] = [];
                                acc[key].push(msg);
                            }
                            return acc;
                        }, {} as Record<string, Message[]>);

                        // Sort conversations by latest message
                        const sortedConversationKeys = Object.keys(conversations).sort((a, b) => {
                            const latestA = conversations[a].sort((m1, m2) => new Date(m2.timestamp).getTime() - new Date(m1.timestamp).getTime())[0];
                            const latestB = conversations[b].sort((m1, m2) => new Date(m2.timestamp).getTime() - new Date(m1.timestamp).getTime())[0];
                            return new Date(latestB.timestamp).getTime() - new Date(latestA.timestamp).getTime();
                        });

                        if (sortedConversationKeys.length === 0) {
                            return (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
                                    <Inbox size={32} className="opacity-20" />
                                    <span className="text-sm font-medium">All caught up</span>
                                </div>
                            );
                        }

                        return sortedConversationKeys.map(convId => (
                            <InboxThreadItem
                                key={convId}
                                convId={convId}
                                messages={conversations[convId]}
                                selectedId={selectedId}
                                filter={filter}
                                currentUser={currentUser}
                                onSelectMessage={onSelectMessage}
                                onDeleteClick={handleDeleteClick}
                                getSender={getSender}
                                formatDate={formatDate}
                            />
                        ));
                    })()
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

interface InboxThreadItemProps {
    convId: string;
    messages: Message[];
    selectedId: string | null;
    filter: 'inbox' | 'sent';
    currentUser: { id: string };
    onSelectMessage: (id: string) => void;
    onDeleteClick: (e: React.MouseEvent, id: string) => void;
    getSender: (id: string) => any;
    formatDate: (isoString: string) => string;
}

const InboxThreadItem: React.FC<InboxThreadItemProps> = ({
    convId,
    messages,
    selectedId,
    filter,
    currentUser,
    onSelectMessage,
    onDeleteClick,
    getSender,
    formatDate
}) => {
    const threadMessages = messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const headMessage = threadMessages[0];
    const otherMessages = threadMessages.slice(1);

    const sender = getSender(headMessage.senderId);
    const isSelected = selectedId === headMessage.id || (otherMessages.some(m => m.id === selectedId));
    const avatarColor = filter === 'sent' ? '#1e2126' : sender.color;

    // Check if this thread is expanded
    const [isExpanded, setIsExpanded] = React.useState(false);

    // Auto-expand if selection is inside
    React.useEffect(() => {
        if (otherMessages.some(m => m.id === selectedId)) {
            setIsExpanded(true);
        }
    }, [selectedId, otherMessages]);

    return (
        <div className="flex flex-col">
            {/* Main Thread Item */}
            <div
                onClick={() => onSelectMessage(headMessage.id)}
                className={`group relative py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 border ${(selectedId === headMessage.id)
                    ? 'bg-white border-gray-200 shadow-sm ring-1 ring-black/5'
                    : 'bg-transparent border-transparent hover:bg-white/60 hover:border-gray-100'
                    }`}
            >
                <div className="flex items-start gap-3">
                    {/* Avatar or Expander */}
                    <div className="relative flex-shrink-0 mt-0.5 flex flex-col items-center gap-1">
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

                        {/* Expander Arrow */}
                        {otherMessages.length > 0 && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsExpanded(!isExpanded);
                                }}
                                className="p-0.5 hover:bg-gray-200 rounded-sm text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
                            >
                                {isExpanded ? (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                ) : (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                )}
                            </button>
                        )}

                        {!headMessage.isRead && filter === 'inbox' && (
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 border-2 border-white rounded-full ring-1 ring-blue-500/20"></div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                            <span className={`text-xs truncate pr-2 ${!headMessage.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                {headMessage.subject}
                                {otherMessages.length > 0 && <span className="ml-1 text-[10px] text-gray-400 font-normal">({otherMessages.length + 1})</span>}
                            </span>
                            <span className={`text-[10px] flex-shrink-0 ${!headMessage.isRead ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                                {formatDate(headMessage.timestamp)}
                            </span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate leading-relaxed">
                            {headMessage.preview}
                        </div>
                    </div>
                </div>

                {/* Delete Button (Visible on Hover) */}
                <button
                    className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 p-1 transition-all z-10 hover:scale-110"
                    onClick={(e) => onDeleteClick(e, headMessage.id)}
                    title="Delete"
                >
                    <Trash2 size={11} color="#1e2126" />
                </button>
            </div>

            {/* Expanded Thread Items */}
            {isExpanded && otherMessages.map(subMsg => {
                const isSubSelected = selectedId === subMsg.id;
                const subSender = getSender(subMsg.senderId);
                return (
                    <div
                        key={subMsg.id}
                        onClick={() => onSelectMessage(subMsg.id)}
                        className={`ml-6 pl-4 py-1.5 pr-2 mb-0.5 rounded-r-lg border-l-2 cursor-pointer transition-all ${isSubSelected
                            ? 'bg-white border-l-blue-500 shadow-sm'
                            : 'bg-stone-100/50 border-l-stone-300 hover:bg-stone-100'
                            }`}
                    >
                        <div className="flex justify-between items-baseline">
                            <span className={`text-[11px] truncate pr-2 ${isSubSelected ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                {subSender.name}
                            </span>
                            <span className="text-[9px] text-gray-400">
                                {formatDate(subMsg.timestamp)}
                            </span>
                        </div>
                        <div className="text-[10px] text-gray-400 truncate">
                            {subMsg.preview}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};
