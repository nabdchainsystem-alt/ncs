import { useToast } from '../../../ui/Toast';
import React, { useState, useRef } from 'react';
import { Reply, Send, Inbox, Paperclip, FileText, Star, Clock, Mail, Printer, MoreHorizontal } from 'lucide-react';
import { Message } from '../types';
import { USERS } from '../../../constants';
import { messageService } from '../messageService';
import { RightSidebar } from '../../discussion/RightSidebar';

interface MessageViewProps {
    selectedMessage: Message | undefined;
    currentUser: { id: string; name: string; email: string };
    replyText: string;
    onReplyChange: (text: string) => void;
    onSendReply: () => void;
    onOpenCompose: () => void;
    onUpdateMessage: () => void;
    users?: any[]; // Dynamic users
}

export const MessageView: React.FC<MessageViewProps> = ({
    selectedMessage,
    currentUser,
    replyText,
    onReplyChange,
    onSendReply,
    onOpenCompose,
    onUpdateMessage,
    users = []
}) => {
    const getSender = (id: string) => {
        // Try to find in dynamic users first
        const found = users.find(u => u.id === id);
        if (found) return { name: found.name, color: found.color || '#999', avatar: found.avatarUrl || found.avatar || '?' };

        // Fallback to constants if needed (legacy)
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
                url: URL.createObjectURL(file) // Mock URL
            };

            const updatedAttachments = [...(selectedMessage.attachments || []), newAttachment];
            await messageService.updateMessage(selectedMessage.id, { attachments: updatedAttachments });
            onUpdateMessage();
        }
    };

    const { showToast } = useToast();

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
        // Snooze for 24 hours
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

    const handlePrint = () => {
        window.print();
    };

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
                            <div className="flex items-center space-x-3">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white overflow-hidden flex-shrink-0"
                                    style={{ backgroundColor: getSender(selectedMessage.senderId).avatar.startsWith('/') ? 'transparent' : (selectedMessage.senderId === currentUser.id ? '#1e2126' : getSender(selectedMessage.senderId).color) }}
                                >
                                    {getSender(selectedMessage.senderId).avatar.startsWith('/') ? (
                                        <img src={getSender(selectedMessage.senderId).avatar} alt={getSender(selectedMessage.senderId).name} className="w-full h-full object-cover" />
                                    ) : (
                                        getSender(selectedMessage.senderId).avatar
                                    )}
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="flex items-baseline space-x-2">
                                        <span className="font-bold text-gray-900 text-sm truncate max-w-[150px]">{getSender(selectedMessage.senderId).name}</span>
                                        <span className="text-xs text-gray-500 hidden sm:inline">&lt;user@{selectedMessage.senderId}.com&gt;</span>
                                    </div>
                                    <div className="text-[10px] font-medium text-gray-400">
                                        {new Date(selectedMessage.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </div>
                                </div>
                            </div>

                            <div className="w-px h-6 bg-gray-200 mx-4 hidden sm:block"></div>

                            {/* Header Tools */}
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={handleToggleStar}
                                    className={`p-1.5 rounded-md transition-all ${selectedMessage.tags.includes('starred') ? 'text-yellow-400 bg-yellow-50' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-50'}`}
                                    title={selectedMessage.tags.includes('starred') ? "Unstar" : "Star"}
                                >
                                    <Star size={18} fill={selectedMessage.tags.includes('starred') ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={handleSnooze}
                                    className={`p-1.5 rounded-md transition-all ${selectedMessage.snoozedUntil ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
                                    title={selectedMessage.snoozedUntil ? "Snoozed" : "Snooze until tomorrow"}
                                >
                                    <Clock size={18} />
                                </button>
                                <button
                                    onClick={handleMarkUnread}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
                                    title="Mark as Unread"
                                >
                                    <Mail size={18} />
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-all"
                                    title="Print"
                                >
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
                        {/* Left: Message Content & Reply */}
                        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                            <div className="flex-1 px-6 py-6 overflow-y-auto custom-scrollbar">
                                <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed whitespace-pre-wrap font-sans">
                                    {selectedMessage.content}
                                </div>

                                {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                                    <div className="mt-8 pt-6 border-t border-gray-100">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Attachments</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {selectedMessage.attachments.map(att => (
                                                <div key={att.id} className="flex items-center p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm hover:bg-gray-100 transition-colors cursor-pointer group">
                                                    <div className="p-2 bg-white rounded-lg shadow-sm mr-3 group-hover:scale-105 transition-transform">
                                                        <FileText size={18} className="text-blue-500" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-700">{att.name}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase">{att.type.split('/')[1] || 'FILE'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reply Area - Sticky at bottom of left panel */}
                            <div className="p-6 bg-white border-t border-gray-100 z-10">
                                <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all overflow-hidden">
                                    <div className="px-4 py-2 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center space-x-2 text-gray-400">
                                            <Reply size={14} />
                                            <span className="text-xs font-medium">Replying to <span className="text-gray-700">{getSender(selectedMessage.senderId).name}</span></span>
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
                                    />
                                    <div className="px-4 py-3 bg-white flex justify-between items-center">
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                                        <div className="text-xs text-gray-400">Press Cmd+Enter to send</div>
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
                        <RightSidebar contextId={selectedMessage.id} className="w-80 border-l border-gray-100 bg-gray-50/30" />
                    </div>


                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Inbox size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Message Selected</h3>
                    <p className="max-w-xs text-center text-sm">Select a message from the sidebar to view it, or start a new conversation.</p>
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
