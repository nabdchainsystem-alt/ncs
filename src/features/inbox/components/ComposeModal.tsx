import React, { useState, useRef } from 'react';
import { X, Send, Paperclip, FileText, Trash2 } from 'lucide-react';
import { USERS } from '../../../constants';
import { messageService } from '../messageService';

interface ComposeModalProps {
    currentUser: { id: string; name: string; email: string };
    onClose: () => void;
    onSend: () => void;
}

export const ComposeModal: React.FC<ComposeModalProps> = ({ currentUser, onClose, onSend }) => {
    const [recipientId, setRecipientId] = useState('u2'); // Default to Hasan
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [attachments, setAttachments] = useState<{ id: string; name: string; type: string; url: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const newAttachment = {
                id: Math.random().toString(36).slice(2),
                name: file.name,
                type: file.type,
                url: URL.createObjectURL(file) // Mock URL
            };
            setAttachments(prev => [...prev, newAttachment]);
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleSend = async () => {
        if (!subject.trim() || !content.trim()) return;

        setIsSending(true);
        try {
            await messageService.sendMessage(subject, content, recipientId, attachments);
            onSend();
            onClose();
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setIsSending(false);
        }
    };

    const availableUsers = Object.values(USERS).filter(u => u.id !== 'me' && u.id !== currentUser.id);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 border border-gray-100">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <h3 className="font-bold text-lg text-gray-900 tracking-tight">New Message</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-all duration-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">To</label>
                        <div className="relative">
                            <select
                                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all cursor-pointer hover:bg-gray-100"
                                value={recipientId}
                                onChange={(e) => setRecipientId(e.target.value)}
                            >
                                {availableUsers.map(user => (
                                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Subject</label>
                        <input
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all hover:bg-gray-100"
                            placeholder="What's this about?"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">Message</label>
                        <textarea
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black min-h-[200px] resize-none transition-all hover:bg-gray-100"
                            placeholder="Write your message..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {attachments.map(att => (
                                <div key={att.id} className="flex items-center p-2 pl-3 bg-white border border-gray-200 rounded-lg text-xs group shadow-sm">
                                    <FileText size={14} className="text-blue-500 mr-2" />
                                    <span className="text-gray-700 font-medium max-w-[150px] truncate">{att.name}</span>
                                    <button
                                        onClick={() => removeAttachment(att.id)}
                                        className="ml-2 text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white flex items-center justify-between sticky bottom-0 z-10">
                    <div className="flex items-center">
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileSelect}
                        />
                        <button
                            className="text-gray-500 hover:text-gray-900 p-2.5 rounded-lg hover:bg-gray-100 transition-all flex items-center space-x-2 group"
                            title="Attach file"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip size={20} className="group-hover:-rotate-45 transition-transform duration-300" />
                            <span className="text-sm font-medium">Attach</span>
                        </button>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!subject.trim() || !content.trim() || isSending}
                            className="px-8 py-2.5 text-sm font-bold bg-black text-white rounded-xl hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
                        >
                            {isSending ? 'Sending...' : (
                                <>
                                    <span>Send Message</span>
                                    <Send size={16} className="ml-2" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
