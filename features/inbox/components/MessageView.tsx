import React from 'react';
import { Archive, Trash2, Reply, Send, Inbox, Plus } from 'lucide-react';
import { Message } from '../types';
import { USERS } from '../../../constants';

interface MessageViewProps {
    selectedMessage: Message | undefined;
    replyText: string;
    onReplyChange: (text: string) => void;
    onSendReply: () => void;
    onOpenCompose: () => void;
}

export const MessageView: React.FC<MessageViewProps> = ({
    selectedMessage,
    replyText,
    onReplyChange,
    onSendReply,
    onOpenCompose
}) => {
    const getSender = (id: string) => USERS[id as keyof typeof USERS] || { name: 'Unknown', color: '#999', avatar: '?' };

    return (
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
                                onChange={(e) => onReplyChange(e.target.value)}
                            />
                            <div className="flex items-center justify-between p-2">
                                <div className="flex space-x-2">
                                    {/* Formatting icons would go here */}
                                </div>
                                <button
                                    onClick={onSendReply}
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
                        onClick={onOpenCompose}
                        className="mt-6 px-6 py-2 bg-clickup-purple text-white rounded-full font-medium shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all flex items-center"
                    >
                        <Plus size={16} className="mr-2" />
                        New Message
                    </button>
                </div>
            )}
        </div>
    );
};
