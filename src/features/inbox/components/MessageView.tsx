import { useToast } from '../../../ui/Toast';
import React, { useState, useRef } from 'react';
import { Reply, Send, Inbox, Paperclip, FileText, Star, Clock, Mail, Printer, MoreHorizontal } from 'lucide-react';
import { Message } from '../types';
import { USERS } from '../../../constants';
import { messageService } from '../messageService';
import { RightSidebar } from '../../discussion/RightSidebar';

interface MessageViewProps {
    selectedMessage: Message | undefined;
    threadMessages?: Message[]; // New prop for full thread
    currentUser: { id: string; name: string; email: string };
    replyText: string;
    onReplyChange: (text: string) => void;
    onSendReply: () => void;
    onOpenCompose: () => void;
    onUpdateMessage: () => void;
    users?: any[];
}

export const MessageView: React.FC<MessageViewProps> = ({
    selectedMessage,
    threadMessages = [], // Default to empty
    currentUser,
    replyText,
    onReplyChange,
    onSendReply,
    onOpenCompose,
    onUpdateMessage,
    users = []
}) => {
    // If no threadMessages passed but selectedMessage exists, use it as single-item thread
    const displayMessages = threadMessages.length > 0 ? threadMessages : (selectedMessage ? [selectedMessage] : []);

    // Sort oldest to newest for Reading (Chronological)
    const sortedMessages = [...displayMessages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const getSender = (id: string) => {
        const found = users.find(u => u.id === id);
        if (found) return { name: found.name, color: found.color || '#999', avatar: found.avatarUrl || found.avatar || '?' };
        return USERS[id as keyof typeof USERS] || { name: 'Unknown', color: '#999', avatar: '?' };
    };

    const fileInputRef = useRef<HTMLInputElement>(null);
    const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!selectedMessage) return;
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newAttachment = {
                id: newId(),
                name: file.name,
                type: file.type,
                url: URL.createObjectURL(file)
            };

            const updatedAttachments = [...(selectedMessage.attachments || []), newAttachment];
            await messageService.updateMessage(selectedMessage.id, { attachments: updatedAttachments });
            onUpdateMessage();
        }
    };

    const { showToast } = useToast();

    // Action handlers (Star, Snooze, etc.) - These apply to the "Head" (selectedMessage) or maybe specific messages?
    // For now, let's keep them acting on `selectedMessage` (the latest one usually).
    const handleToggleStar = async () => {
        if (!selectedMessage) return;
        const isStarred = selectedMessage.tags.includes('starred');
        const newTags = (isStarred
            ? selectedMessage.tags.filter(t => t !== 'starred')
            : [...selectedMessage.tags, 'starred']) as ('inbox' | 'sent' | 'archived' | 'starred')[];
        await messageService.updateMessage(selectedMessage.id, { tags: newTags });
        onUpdateMessage();
        showToast(isStarred ? 'Message unstarred' : 'Message starred', 'success');
    };

    const handleSnooze = async () => {
        if (!selectedMessage) return;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await messageService.updateMessage(selectedMessage.id, { snoozedUntil: tomorrow.toISOString() });
        onUpdateMessage();
        showToast('Message snoozed until tomorrow', 'success');
    };

    const handleMarkUnread = async () => {
        if (!selectedMessage) return;
        await messageService.updateMessage(selectedMessage.id, { isRead: false });
        onUpdateMessage();
        showToast('Marked as unread', 'success');
    };

    const handlePrint = () => window.print();

    // Auto-scroll to bottom of thread
    const bottomRef = useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [sortedMessages.length, selectedMessage?.id]);

    // Scroll to specific message when selected
    const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

    React.useEffect(() => {
        if (selectedMessage && messageRefs.current[selectedMessage.id]) {
            messageRefs.current[selectedMessage.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Fallback to bottom if needed, or do nothing? 
            // If we just clicked a conversation, usually desired is bottom.
            // But if we clicked a specific reply, it's that reply.
        }
    }, [selectedMessage?.id]);

    return (
        <div className="flex-1 flex flex-col bg-white h-full min-w-0 relative z-0">
            {selectedMessage ? (
                <>
                    {/* Header */}
                    <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white flex-shrink-0 sticky top-0 z-10">
                        <div className="flex items-center min-w-0">
                            <h1 className="text-lg font-bold text-gray-800 truncate mr-4">{selectedMessage.subject}</h1>
                        </div>
                        <div className="flex items-center justify-between flex-shrink-0">
                            {/* Standard Header Tools */}
                            <div className="flex items-center space-x-1">
                                <button onClick={handleToggleStar} className={`p-1.5 rounded-md transition-all ${selectedMessage.tags.includes('starred') ? 'text-yellow-400 bg-yellow-50' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-50'}`} title="Star">
                                    <Star size={18} fill={selectedMessage.tags.includes('starred') ? "currentColor" : "none"} />
                                </button>
                                <button onClick={handleSnooze} className={`p-1.5 rounded-md transition-all ${selectedMessage.snoozedUntil ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`} title="Snooze">
                                    <Clock size={18} />
                                </button>
                                <button onClick={handleMarkUnread} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all" title="Mark as Unread">
                                    <Mail size={18} />
                                </button>
                                <button onClick={handlePrint} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all" title="Print">
                                    <Printer size={18} />
                                </button>
                                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                <button className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all" title="More options">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area with Right Sidebar */}
                    <div className="flex-1 flex min-h-0 bg-white">
                        {/* Left: Message Thread & Reply */}
                        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                            <div className="flex-1 px-4 py-4 overflow-y-auto custom-scrollbar space-y-4">
                                {sortedMessages.map((msg, index) => {
                                    const sender = getSender(msg.senderId);
                                    const isMe = msg.senderId === currentUser.id;
                                    const isSelected = selectedMessage.id === msg.id;

                                    return (
                                        <div
                                            key={msg.id}
                                            ref={el => { messageRefs.current[msg.id] = el }}
                                            className={`border rounded-lg transition-all duration-300 overflow-hidden bg-white border-gray-200 shadow-sm ${isSelected ? 'ring-2 ring-blue-500/20 shadow-md' : ''
                                                }`}
                                        >
                                            {/* Header / Summary Row */}
                                            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/30">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    {/* Avatar */}
                                                    <div className="flex-shrink-0">
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-2 ring-white overflow-hidden"
                                                            style={{ backgroundColor: sender.avatar.startsWith('/') ? 'transparent' : (isMe ? '#1e2126' : sender.color) }}
                                                        >
                                                            {sender.avatar.startsWith('/') ? (
                                                                <img src={sender.avatar} alt={sender.name} className="w-full h-full object-cover" />
                                                            ) : sender.avatar}
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-gray-900 text-sm truncate">{sender.name}</span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(msg.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {/* Could add fast actions here */}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                                                    {msg.content}
                                                </div>

                                                {/* Attachments */}
                                                {msg.attachments && msg.attachments.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                                        <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Attachments</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {msg.attachments.map(att => (
                                                                <button key={att.id} className="flex items-center p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs hover:bg-gray-100 transition-colors group shadow-sm text-left">
                                                                    <FileText size={16} className="text-blue-500 mr-2" />
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium text-gray-700 truncate max-w-[150px]">{att.name}</span>
                                                                        <span className="text-[10px] text-gray-400">.{att.name.split('.').pop()}</span>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} className="h-1" />
                            </div>

                            {/* Reply Area - Sticky at bottom */}
                            <div className="p-6 bg-white border-t border-gray-100 z-10">
                                <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all overflow-hidden">
                                    <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center space-x-2 text-gray-400">
                                            <Reply size={14} />
                                            <span className="text-xs font-medium">Replying to thread...</span>
                                        </div>
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <Paperclip size={14} onClick={() => fileInputRef.current?.click()} />
                                        </button>
                                    </div>
                                    <textarea
                                        className="w-full p-4 min-h-[100px] focus:outline-none text-sm resize-none placeholder-gray-400"
                                        placeholder="Write your reply..."
                                        value={replyText}
                                        onChange={(e) => onReplyChange(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                                onSendReply();
                                            }
                                        }}
                                    />
                                    <div className="px-4 py-3 bg-white flex justify-between items-center">
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                                        <div className="text-xs text-gray-400 hidden sm:block">Press Cmd+Enter to send</div>
                                        <button
                                            onClick={onSendReply}
                                            disabled={!replyText.trim()}
                                            className="bg-black text-white px-6 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                                        >
                                            <span>Send Reply</span>
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar: Shared Component */}
                        <RightSidebar contextId={selectedMessage.id} className="w-80 border-l border-gray-100 bg-gray-50/30 hidden lg:flex" />
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Inbox size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Conversation Selected</h3>
                    <p className="max-w-xs text-center text-sm">Select a conversation from the sidebar to view the thread.</p>
                    <button
                        onClick={onOpenCompose}
                        className="mt-6 px-4 py-2 bg-[#1e2126] text-white rounded-md text-sm font-medium hover:bg-[#2c3036] transition-colors"
                    >
                        Compose Message
                    </button>
                </div>
            )}
        </div>
    );
};
