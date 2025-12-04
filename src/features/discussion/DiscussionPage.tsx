import React, { useState, useEffect } from 'react';
import { Send, Hash, Search, Phone, Video, Info, Plus, Trash2, Paperclip, Smile, Bold, Italic, Code, List, Link as LinkIcon, PlusCircle, Mic } from 'lucide-react';
import { CreateDiscussionModal } from './CreateDiscussionModal';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { USERS } from '../../constants';
import { discussionService, Channel, Message } from './discussionService';

const DiscussionPage: React.FC = () => {
    const [activeChannel, setActiveChannel] = useState<string | null>(null);
    const [messageInput, setMessageInput] = useState('');
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [channelToDelete, setChannelToDelete] = useState<string | null>(null);

    // State for channels and messages
    const [channels, setChannels] = useState<Channel[]>([]);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});

    // Load channels on mount
    useEffect(() => {
        loadChannels();
    }, []);

    // Load messages when active channel changes
    useEffect(() => {
        if (activeChannel) {
            loadMessages(activeChannel);
            // Optional: Set up polling for real-time-ish updates
            const interval = setInterval(() => loadMessages(activeChannel), 3000);
            return () => clearInterval(interval);
        }
    }, [activeChannel]);

    const loadChannels = async () => {
        const fetchedChannels = await discussionService.getChannels();
        setChannels(fetchedChannels);
    };

    const loadMessages = async (channelId: string) => {
        const fetchedMessages = await discussionService.getMessages(channelId);
        setMessages(prev => ({
            ...prev,
            [channelId]: fetchedMessages
        }));
    };

    const handleCreateChannel = async (name: string, participants: string[]) => {
        const newChannel = await discussionService.createChannel(name, participants);
        setChannels(prev => [...prev, newChannel]);
        setActiveChannel(newChannel.id);
    };

    const handleDeleteChannel = (e: React.MouseEvent, channelId: string) => {
        e.stopPropagation();
        setChannelToDelete(channelId);
    };

    const confirmDeleteChannel = async () => {
        if (!channelToDelete) return;

        try {
            await discussionService.deleteChannel(channelToDelete);
            setChannels(prev => prev.filter(c => c.id !== channelToDelete));
            if (activeChannel === channelToDelete) {
                setActiveChannel(null);
            }
        } catch (error) {
            console.error('Failed to delete channel:', error);
        }
        setChannelToDelete(null);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeChannel) return;

        try {
            // Optimistic update
            const tempMessage: Message = {
                id: `temp-${Date.now()}`,
                sender: 'You',
                senderId: 'me',
                content: messageInput,
                timestamp: new Date().toISOString(),
                channelId: activeChannel
            };

            setMessages(prev => ({
                ...prev,
                [activeChannel]: [...(prev[activeChannel] || []), tempMessage]
            }));
            setMessageInput('');

            // Actual send
            await discussionService.sendMessage(activeChannel, tempMessage.content);
            loadMessages(activeChannel); // Reload to get the real message with ID
        } catch (error) {
            console.error('Failed to send message:', error);
            // Revert optimistic update if needed (omitted for simplicity)
        }
    };

    const currentChannel = channels.find(c => c.id === activeChannel);
    const currentMessages = activeChannel ? (messages[activeChannel] || []) : [];

    return (
        <div className="flex h-full bg-white overflow-hidden">
            {/* Sidebar - Channels */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="font-bold text-gray-800">Discussions</h2>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="p-1 hover:bg-gray-200 rounded-md text-gray-500 transition-colors"
                        title="New Discussion"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Channels</h3>
                        {channels.length === 0 && (
                            <div className="px-2 text-sm text-gray-400 italic">No discussions yet. Start one!</div>
                        )}
                        {channels.map(channel => (
                            <button
                                key={channel.id}
                                onClick={() => setActiveChannel(channel.id)}
                                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors group ${activeChannel === channel.id
                                    ? 'bg-gray-200 text-gray-900 font-medium'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center truncate">
                                    <Hash size={16} className="mr-2 opacity-70 flex-shrink-0" />
                                    <span className="truncate">{channel.name}</span>
                                </div>
                                <div
                                    onClick={(e) => handleDeleteChannel(e, channel.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                    title="Delete Discussion"
                                >
                                    <Trash2 size={14} />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
                {activeChannel ? (
                    <>
                        {/* Header */}
                        <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white flex-shrink-0">
                            <div className="flex items-center min-w-0">
                                <Hash size={20} className="text-gray-400 mr-2 flex-shrink-0" />
                                <h3 className="font-bold text-gray-800 truncate">{currentChannel?.name}</h3>
                                {currentChannel?.participants && currentChannel.participants.length > 0 && (
                                    <div className="ml-4 flex items-center space-x-1 overflow-hidden">
                                        {currentChannel.participants.map(userId => {
                                            const user = USERS[userId as keyof typeof USERS];
                                            if (!user) return null;
                                            return (
                                                <div key={userId} className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold ring-2 ring-white" style={{ backgroundColor: user.color }} title={user.name}>
                                                    {user.avatar}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center space-x-3 text-gray-500 flex-shrink-0 ml-2">
                                <button className="p-1.5 hover:bg-gray-100 rounded-md"><Search size={18} /></button>
                                <button className="p-1.5 hover:bg-gray-100 rounded-md"><Phone size={18} /></button>
                                <button className="p-1.5 hover:bg-gray-100 rounded-md"><Video size={18} /></button>
                                <button className="p-1.5 hover:bg-gray-100 rounded-md"><Info size={18} /></button>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {currentMessages.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Hash size={48} className="mb-4 opacity-20" />
                                    <p>Start the conversation in #{currentChannel?.name}!</p>
                                </div>
                            )}
                            {currentMessages.map((msg, index) => {
                                const isMe = msg.senderId === 'me' || msg.sender === 'You'; // Handle legacy 'You'
                                const showAvatar = index === 0 || currentMessages[index - 1].sender !== msg.sender;

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                                        {!isMe && (
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold mr-3 flex-shrink-0 mt-1">
                                                {showAvatar ? msg.avatar : ''}
                                            </div>
                                        )}

                                        <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                            {showAvatar && (
                                                <div className="flex items-baseline mb-1">
                                                    <span className="font-semibold text-sm text-gray-900 mr-2">{msg.sender}</span>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            )}
                                            <div
                                                className={`px-4 py-2 rounded-lg text-sm shadow-sm ${isMe
                                                    ? 'bg-gray-900 text-white rounded-tr-none'
                                                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                                    }`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>

                                        {isMe && (
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-800 text-xs font-bold ml-3 flex-shrink-0 mt-1">
                                                You
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Message Input Area */}
                        <div className="p-4 border-t border-gray-200 bg-white">
                            <form onSubmit={handleSendMessage} className="relative rounded-xl border border-gray-300 shadow-sm transition-all bg-gray-50 focus-within:ring-0 focus-within:border-gray-400">

                                {/* Toolbar */}
                                <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200/50">
                                    <div className="flex items-center space-x-1">
                                        <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors" title="Bold">
                                            <Bold size={16} />
                                        </button>
                                        <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors" title="Italic">
                                            <Italic size={16} />
                                        </button>
                                        <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors" title="Code">
                                            <Code size={16} />
                                        </button>
                                        <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors" title="List">
                                            <List size={16} />
                                        </button>
                                        <div className="w-px h-4 bg-gray-300 mx-1" />
                                        <button type="button" className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors" title="Add Link">
                                            <LinkIcon size={16} />
                                        </button>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button type="button" className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
                                            <PlusCircle size={14} />
                                            <span>Integration</span>
                                        </button>
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    value={messageInput}
                                    onChange={(e) => setMessageInput(e.target.value)}
                                    placeholder={`Message #${currentChannel?.name}`}
                                    className="w-full py-3 px-4 bg-transparent border-none focus:ring-0 outline-none text-sm min-h-[50px]"
                                />

                                <div className="flex items-center justify-between px-2 py-2">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                                            title="Attach File"
                                        >
                                            <Paperclip size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                                            title="Add Emoji"
                                        >
                                            <Smile size={18} />
                                        </button>
                                        <button
                                            type="button"
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                                            title="Record Voice"
                                        >
                                            <Mic size={18} />
                                        </button>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="text-xs text-gray-400 mr-2 hidden sm:block">
                                            <strong>Return</strong> to send
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!messageInput.trim()}
                                            className={`p-2 rounded-lg transition-colors ${messageInput.trim()
                                                ? 'bg-gray-900 text-white hover:bg-black shadow-md'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Hash size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-600 mb-2">No Discussion Selected</h3>
                        <p className="max-w-xs text-center text-sm">Select a channel from the sidebar or start a new discussion to get chatting.</p>
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="mt-6 px-4 py-2 bg-[#1e2126] text-white rounded-md text-sm font-medium hover:bg-[#2c3036] transition-colors"
                        >
                            Start New Discussion
                        </button>
                    </div>
                )}
            </div>

            <CreateDiscussionModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreate={handleCreateChannel}
            />

            <ConfirmModal
                isOpen={!!channelToDelete}
                onClose={() => setChannelToDelete(null)}
                onConfirm={confirmDeleteChannel}
                title="Delete Discussion"
                message="Are you sure you want to delete this discussion? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default DiscussionPage;
