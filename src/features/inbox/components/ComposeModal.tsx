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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="font-semibold text-gray-800">New Message</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">To</label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-black"
                            value={recipientId}
                            onChange={(e) => setRecipientId(e.target.value)}
                        >
                            {availableUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Subject</label>
                        <input
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-black"
                            placeholder="What's this about?"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Message</label>
                        <textarea
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-black min-h-[150px] resize-none"
                            placeholder="Write your message..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {attachments.map(att => (
                                <div key={att.id} className="flex items-center p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs group">
                                    <FileText size={14} className="text-gray-400 mr-2" />
                                    <span className="text-gray-700 max-w-[150px] truncate">{att.name}</span>
                                    <button
                                        onClick={() => removeAttachment(att.id)}
                                        className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                    />
                    <button
                        className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-200 transition"
                        title="Attach file"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip size={18} />
                    </button>
                    <div className="flex space-x-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!subject.trim() || !content.trim() || isSending}
                            className="px-4 py-2 text-sm font-medium bg-[#1e2126] text-white rounded-lg hover:bg-[#2c3036] transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-gray-200"
                        >
                            {isSending ? 'Sending...' : (
                                <>
                                    <span>Send</span>
                                    <Send size={14} className="ml-2" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
