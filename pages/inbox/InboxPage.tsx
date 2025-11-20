import React, { useState, useEffect } from 'react';
import { Message } from '../../types';
import { USERS } from '../../constants';
import { api } from '../../services/api';
import { Search, Inbox, Send, Archive, Trash2, MoreVertical, Reply, Check, Loader2, Plus } from 'lucide-react';
import { useToast } from '../../components/Toast';

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
            const data = await api.getMessages();
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
            await api.markMessageRead(id);
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;

        const currentMsg = messages.find(m => m.id === selectedId);
        const subject = currentMsg ? `Re: ${currentMsg.subject}` : 'New Message';

        showToast('Sending...', 'info');
        try {
            await api.sendMessage(subject, replyText);
            setReplyText('');
            showToast('Reply sent!', 'success');
            loadMessages(); // Refresh to see sent message if we were displaying sent items
        } catch (e) {
            showToast('Failed to send', 'error');
        }
    };

    const selectedMessage = messages.find(m => m.id === selectedId);
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
        <div className="flex h-full bg-white overflow-hidden animate-in fade-in duration-300">
            {/* Sidebar / Message List */}
            <div className="w-96 border-r border-gray-200 flex flex-col bg-gray-50/50">
                {/* Toolbar */}
                <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
                    <h2 className="font-bold text-lg flex items-center text-gray-700">
                        <Inbox className="mr-2 text-clickup-purple" size={20} />
                        Inbox
                    </h2>
                    <div className="flex space-x-1">
                        <button className="p-1.5 hover:bg-gray-100 rounded text-gray-500" onClick={loadMessages}>
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
                        onClick={() => setFilter('inbox')}
                        className={`flex-1 pb-2 text-sm font-medium border-b-2 transition-colors ${filter === 'inbox' ? 'border-clickup-purple text-clickup-purple' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        Primary
                    </button>
                    <button
                        onClick={() => setFilter('sent')}
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
                                    onClick={() => handleSelect(msg.id)}
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

            {/* Reading Pane */}
            <div className="flex-1 flex flex-col bg-white h-full min-w-0">
                {selectedMessage ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-start justify-between mb-4">
                                <h1 className="text-xl font-bold text-gray-800 leading-tight">{selectedMessage.subject}</h1>
                                <div className="flex space-x-2 text-gray-400">
                                    <button className="p-2 hover:bg-gray-100 rounded-full" title="Archive"><Archive size={18} /></button>
                                    <button className="p-2 hover:bg-gray-100 rounded-full hover:text-red-500" title="Delete"><Trash2 size={18} /></button>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm"
                                    style={{ backgroundColor: getSender(selectedMessage.senderId).color }}
                                >
                                    {getSender(selectedMessage.senderId).avatar}
                                </div>
                                <div>
                                    <div className="flex items-baseline space-x-2">
                                        <span className="font-bold text-gray-900">{getSender(selectedMessage.senderId).name}</span>
                                        <span className="text-xs text-gray-500">&lt;user@{selectedMessage.senderId}.com&gt;</span>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        To: Me • {new Date(selectedMessage.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-8 overflow-y-auto text-gray-800 leading-relaxed whitespace-pre-wrap font-sans text-sm">
                            {selectedMessage.content}
                        </div>

                        {/* Reply Area */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-clickup-purple transition-all">
                                <div className="p-2 border-b border-gray-100 bg-gray-50/50 flex items-center space-x-2 text-gray-400">
                                    <Reply size={14} />
                                    <span className="text-xs font-medium">Replying to {getSender(selectedMessage.senderId).name}...</span>
                                </div>
                                <textarea
                                    className="w-full p-3 min-h-[80px] focus:outline-none text-sm resize-none"
                                    placeholder="Write your reply..."
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="flex items-center justify-between p-2">
                                    <div className="flex space-x-2">
                                        {/* Formatting icons would go here */}
                                    </div>
                                    <button
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim()}
                                        className="bg-clickup-purple text-white px-4 py-1.5 rounded text-sm font-medium flex items-center space-x-2 disabled:opacity-50 hover:brightness-110 transition-all"
                                    >
                                        <span>Send</span>
                                        <Send size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/30">
                        <div className="bg-gray-100 p-6 rounded-full mb-4">
                            <Inbox size={48} className="text-gray-300" />
                        </div>
                        <p className="text-lg font-medium text-gray-400">Select a message to read</p>
                        <p className="text-sm max-w-xs text-center mt-2">Stay on top of your communications directly within your workspace.</p>
                        <button
                            onClick={() => showToast('Compose Window Opened', 'info')}
                            className="mt-6 px-6 py-2 bg-clickup-purple text-white rounded-full font-medium shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all flex items-center"
                        >
                            <Plus size={16} className="mr-2" />
                            New Message
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InboxView;