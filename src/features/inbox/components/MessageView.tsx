import { useToast } from '../../../ui/Toast';
import React, { useMemo, useState, useRef } from 'react';
import { Archive, Trash2, Reply, Send, Inbox, Plus, Paperclip, FileText, Star, Clock, Mail, Printer, MoreHorizontal } from 'lucide-react';
import { Message } from '../types';
import { USERS } from '../../../constants';
import { messageService } from '../messageService';

interface MessageViewProps {
    selectedMessage: Message | undefined;
    currentUser: { id: string; name: string; email: string };
    replyText: string;
    onReplyChange: (text: string) => void;
    onSendReply: () => void;
    onOpenCompose: () => void;
    onUpdateMessage: () => void;
}

export const MessageView: React.FC<MessageViewProps> = ({
    selectedMessage,
    currentUser,
    replyText,
    onReplyChange,
    onSendReply,
    onOpenCompose,
    onUpdateMessage
}) => {
    const getSender = (id: string) => USERS[id as keyof typeof USERS] || { name: 'Unknown', color: '#999', avatar: '?' };

    type Reminder = { id: string; title: string; description: string };
    type MiniTask = { id: string; title: string; description: string; status: 'todo' | 'inProgress' | 'done'; sourceEmailId?: string };

    const [isAddingReminder, setIsAddingReminder] = useState(false);
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderDescription, setReminderDescription] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

    const handleAddReminder = async () => {
        if (!reminderTitle.trim() && !reminderDescription.trim()) return;
        if (!selectedMessage) return;

        const next: Reminder = {
            id: newId(),
            title: reminderTitle.trim() || 'Untitled',
            description: reminderDescription.trim(),
        };

        const updatedNotes = [next, ...(selectedMessage.notes || [])];
        await messageService.updateMessage(selectedMessage.id, { notes: updatedNotes });
        onUpdateMessage();

        setReminderTitle('');
        setReminderDescription('');
        setIsAddingReminder(false);
    };

    const handleAddTaskFromEmail = async () => {
        if (!selectedMessage) return;
        const next: MiniTask = {
            id: newId(),
            title: selectedMessage.subject || 'Email task',
            description: selectedMessage.preview || selectedMessage.content.slice(0, 140),
            status: 'todo',
            sourceEmailId: selectedMessage.id,
        };

        const updatedTasks = [next, ...(selectedMessage.tasks || [])];
        await messageService.updateMessage(selectedMessage.id, { tasks: updatedTasks });
        onUpdateMessage();
    };

    const updateMiniTaskStatus = async (id: string, status: MiniTask['status']) => {
        if (!selectedMessage) return;
        const updatedTasks = (selectedMessage.tasks || []).map(task => task.id === id ? { ...task, status } : task);
        await messageService.updateMessage(selectedMessage.id, { tasks: updatedTasks });
        onUpdateMessage();
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!selectedMessage) return;
        const updatedNotes = (selectedMessage.notes || []).filter(n => n.id !== noteId);
        await messageService.updateMessage(selectedMessage.id, { notes: updatedNotes });
        onUpdateMessage();
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!selectedMessage) return;
        const updatedTasks = (selectedMessage.tasks || []).filter(t => t.id !== taskId);
        await messageService.updateMessage(selectedMessage.id, { tasks: updatedTasks });
        onUpdateMessage();
    };

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

    const tasksByStatus = useMemo(
        () => ({
            todo: (selectedMessage?.tasks || []).filter(t => t.status === 'todo'),
            inProgress: (selectedMessage?.tasks || []).filter(t => t.status === 'inProgress'),
            done: (selectedMessage?.tasks || []).filter(t => t.status === 'done'),
        }),
        [selectedMessage]
    );

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
                    <div className="px-8 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                        <div className="flex items-start justify-between mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">{selectedMessage.subject}</h1>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md ring-4 ring-gray-50 overflow-hidden"
                                    style={{ backgroundColor: getSender(selectedMessage.senderId).avatar.startsWith('/') ? 'transparent' : (selectedMessage.senderId === currentUser.id ? '#1e2126' : getSender(selectedMessage.senderId).color) }}
                                >
                                    {getSender(selectedMessage.senderId).avatar.startsWith('/') ? (
                                        <img src={getSender(selectedMessage.senderId).avatar} alt={getSender(selectedMessage.senderId).name} className="w-full h-full object-cover" />
                                    ) : (
                                        getSender(selectedMessage.senderId).avatar
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-baseline space-x-2">
                                        <span className="font-bold text-gray-900 text-base">{getSender(selectedMessage.senderId).name}</span>
                                        <span className="text-sm text-gray-500">&lt;user@{selectedMessage.senderId}.com&gt;</span>
                                    </div>
                                    <div className="text-xs font-medium text-gray-400 mt-0.5">
                                        To: Me • {new Date(selectedMessage.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </div>
                                </div>
                            </div>

                            {/* Header Tools */}
                            <div className="flex items-center space-x-1">
                                <button
                                    onClick={handleToggleStar}
                                    className={`p-2 rounded-full transition-all ${selectedMessage.tags.includes('starred') ? 'text-yellow-400 bg-yellow-50' : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-50'}`}
                                    title={selectedMessage.tags.includes('starred') ? "Unstar" : "Star"}
                                >
                                    <Star size={18} fill={selectedMessage.tags.includes('starred') ? "currentColor" : "none"} />
                                </button>
                                <button
                                    onClick={handleSnooze}
                                    className={`p-2 rounded-full transition-all ${selectedMessage.snoozedUntil ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'}`}
                                    title={selectedMessage.snoozedUntil ? "Snoozed" : "Snooze until tomorrow"}
                                >
                                    <Clock size={18} />
                                </button>
                                <button
                                    onClick={handleMarkUnread}
                                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                                    title="Mark as Unread"
                                >
                                    <Mail size={18} />
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                                    title="Print"
                                >
                                    <Printer size={18} />
                                </button>
                                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all" title="More options">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area with Right Sidebar */}
                    <div className="flex-1 flex min-h-0">
                        {/* Left: Message Content & Reply */}
                        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
                            <div className="flex-1 px-8 py-8 overflow-y-auto custom-scrollbar">
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

                        {/* Right Sidebar: Action Items & Notes */}
                        <div className="w-80 border-l border-gray-100 bg-gray-50/30 flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-6">
                            {/* Tasks Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        <h3 className="text-sm font-bold text-gray-800">Action Items</h3>
                                    </div>
                                    <button
                                        onClick={handleAddTaskFromEmail}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                                        title="Create Task"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {(['todo', 'inProgress', 'done'] as const).map(status => (
                                        <div key={status} className="space-y-1.5">
                                            {(tasksByStatus as any)[status].length > 0 && (
                                                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pl-1">
                                                    {status === 'inProgress' ? 'In Progress' : status}
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                {(tasksByStatus as any)[status].map((task: MiniTask) => (
                                                    <div key={task.id} className="bg-white p-2.5 rounded-lg shadow-sm border border-gray-200 group hover:shadow-md transition-all relative pr-7">
                                                        <div className="text-xs font-medium text-gray-800 mb-1 leading-tight">{task.title}</div>
                                                        <select
                                                            value={task.status}
                                                            onChange={(e) => updateMiniTaskStatus(task.id, e.target.value as MiniTask['status'])}
                                                            className="w-full text-[10px] bg-gray-50 border-none rounded px-2 py-0.5 text-gray-500 focus:ring-0 cursor-pointer hover:bg-gray-100 transition-colors mt-0.5"
                                                        >
                                                            <option value="todo">To Do</option>
                                                            <option value="inProgress">In Progress</option>
                                                            <option value="done">Done</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleDeleteTask(task.id)}
                                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {Object.values(tasksByStatus).flat().length === 0 && (
                                        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-center">
                                            <span className="text-xs text-gray-400 mb-1">No tasks yet</span>
                                            <button
                                                onClick={handleAddTaskFromEmail}
                                                className="text-[10px] font-medium text-blue-600 hover:underline"
                                            >
                                                Create from email
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-gray-200"></div>

                            {/* Notes Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
                                        <h3 className="text-sm font-bold text-gray-800">Notes</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsAddingReminder(prev => !prev)}
                                        className="p-1.5 hover:bg-yellow-100 rounded-lg text-yellow-600 transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>

                                {isAddingReminder && (
                                    <div className="bg-white rounded-xl p-2.5 shadow-sm border border-yellow-100 mb-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
                                        <input
                                            className="w-full text-xs font-medium placeholder-gray-400 focus:outline-none"
                                            placeholder="Title"
                                            value={reminderTitle}
                                            onChange={(e) => setReminderTitle(e.target.value)}
                                            autoFocus
                                        />
                                        <textarea
                                            className="w-full text-[10px] text-gray-600 placeholder-gray-300 focus:outline-none resize-none"
                                            placeholder="Details..."
                                            rows={2}
                                            value={reminderDescription}
                                            onChange={(e) => setReminderDescription(e.target.value)}
                                        />
                                        <div className="flex justify-end space-x-2 pt-1">
                                            <button
                                                onClick={() => setIsAddingReminder(false)}
                                                className="text-[10px] text-gray-400 hover:text-gray-600"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleAddReminder}
                                                className="text-[10px] bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded font-medium hover:bg-yellow-500 transition-colors"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    {!selectedMessage?.notes?.length ? (
                                        <div className="p-3 bg-yellow-50/50 rounded-xl border border-yellow-100/50 text-center">
                                            <p className="text-xs text-gray-400 italic">No notes attached.</p>
                                        </div>
                                    ) : (
                                        selectedMessage.notes.map(item => (
                                            <div key={item.id} className="bg-white p-2.5 rounded-lg shadow-sm border border-yellow-100/50 group relative pr-7">
                                                <div className="font-semibold text-xs text-gray-800">{item.title}</div>
                                                {item.description && <p className="text-[10px] text-gray-500 mt-0.5">{item.description}</p>}
                                                <button
                                                    onClick={() => handleDeleteNote(item.id)}
                                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-50"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <Inbox size={40} className="text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Inbox</h2>
                    <p className="text-gray-500 max-w-md text-center mb-8">Select a message from the sidebar to view it, or start a new conversation.</p>
                    <button
                        onClick={onOpenCompose}
                        className="px-8 py-3 bg-black text-white rounded-full font-semibold shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center space-x-2"
                    >
                        <Plus size={18} />
                        <span>Compose Message</span>
                    </button>
                </div>
            )}
        </div>
    );
};
