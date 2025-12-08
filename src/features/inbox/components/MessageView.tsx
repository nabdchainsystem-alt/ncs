import { useToast } from '../../../ui/Toast';
import React, { useMemo, useState, useRef } from 'react';
import { Archive, Trash2, Reply, Send, Inbox, Plus, Paperclip, FileText, Star, Clock, Mail, Printer, MoreHorizontal, ChevronDown } from 'lucide-react';
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

    type Reminder = { id: string; title: string; description: string };
    type MiniTask = { id: string; title: string; description: string; status: string; sourceEmailId?: string };

    // Default statuses
    const DEFAULT_STATUSES = ['To Do', 'In Progress', 'Waiting', 'Done', 'Canceled'] as const;

    const [isAddingReminder, setIsAddingReminder] = useState(false);
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderDescription, setReminderDescription] = useState('');
    const [selectedNote, setSelectedNote] = useState<Reminder | null>(null);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskContent, setNewTaskContent] = useState('');
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

    const handleUpdateNote = async (id: string, updates: Partial<Reminder>) => {
        if (!selectedMessage) return;
        const updatedNotes = (selectedMessage.notes || []).map(n => n.id === id ? { ...n, ...updates } : n);
        await messageService.updateMessage(selectedMessage.id, { notes: updatedNotes });
        onUpdateMessage();
        if (selectedNote && selectedNote.id === id) {
            setSelectedNote(prev => prev ? { ...prev, ...updates } : null);
        }
    };

    const handleAddTaskFromEmail = async () => {
        if (!selectedMessage) return;
        const next: MiniTask = {
            id: newId(),
            title: selectedMessage.subject || 'Email task',
            description: selectedMessage.preview || selectedMessage.content.slice(0, 140),
            status: 'To Do',
            sourceEmailId: selectedMessage.id,
        };

        const updatedTasks = [next, ...(selectedMessage.tasks || [])];
        await messageService.updateMessage(selectedMessage.id, { tasks: updatedTasks });
        onUpdateMessage();
    };

    const updateMiniTaskStatus = async (id: string, status: string) => {
        if (!selectedMessage) return;

        // Handle "Create new..."
        let finalStatus = status;
        if (status === '__CREATE_NEW__') {
            const newStatus = prompt("Enter new status name:");
            if (!newStatus || !newStatus.trim()) return;
            finalStatus = newStatus.trim();
        }

        const updatedTasks = (selectedMessage.tasks || []).map(task => task.id === id ? { ...task, status: finalStatus } : task);
        await messageService.updateMessage(selectedMessage.id, { tasks: updatedTasks });
        onUpdateMessage();
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!selectedMessage) return;
        const updatedNotes = (selectedMessage.notes || []).filter(n => n.id !== noteId);
        await messageService.updateMessage(selectedMessage.id, { notes: updatedNotes });
        onUpdateMessage();
        if (selectedNote?.id === noteId) setSelectedNote(null);
    };

    const handleDeleteTask = async (taskId: string) => {
        if (!selectedMessage) return;
        const updatedTasks = (selectedMessage.tasks || []).filter(t => t.id !== taskId);
        await messageService.updateMessage(selectedMessage.id, { tasks: updatedTasks });
        onUpdateMessage();
    };

    const handleSaveNewTask = async () => {
        if (!newTaskContent.trim()) return;
        if (!selectedMessage) return;

        const next: MiniTask = {
            id: newId(),
            title: newTaskContent.trim(),
            description: '',
            status: 'To Do',
        };

        const updatedTasks = [next, ...(selectedMessage.tasks || [])];
        await messageService.updateMessage(selectedMessage.id, { tasks: updatedTasks });
        onUpdateMessage();
        setNewTaskContent('');
        setIsAddingTask(false);
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

    const tasksByStatus = useMemo(() => {
        const groups: Record<string, MiniTask[]> = {};

        // Initialize default groups
        DEFAULT_STATUSES.forEach(s => groups[s] = []);

        // Group tasks
        (selectedMessage?.tasks || []).forEach(t => {
            // Unify old 'todo'/'inProgress' to 'To Do'/'In Progress' if needed, or just support them as is.
            // For now, let's just group by whatever string is there.
            // If it's a legacy lower-case one, we could map it, but for stability let's trust the current values + new values.
            // Actually, we should map the legacy ones if they exist to the new Capitalized defaults for consistency? 
            // The prompt "make name for those to do" implies customization. 
            // We'll trust the string value.

            // Map legacy 'todo' -> 'To Do', 'inProgress' -> 'In Progress' for display consistency if we want, 
            // but let's stick to raw string to avoid unintended side effects unless explicitly migrated.
            // Wait, previous step introduced 'todo' etc. I should probably migrate them on the fly or just support them.
            // Let's support them as valid keys.

            const s = t.status; // Raw string
            if (!groups[s]) groups[s] = [];
            groups[s].push(t);
        });

        return groups;
    }, [selectedMessage]);

    const allStatuses = useMemo(() => {
        const statusSet = new Set([...DEFAULT_STATUSES, ...Object.keys(tasksByStatus)]);
        // Filter out any legacy keys if empty? No, show what's there.
        // Also remove '__CREATE_NEW__' if it somehow got in.
        return Array.from(statusSet).filter(s => s !== '__CREATE_NEW__' && s !== 'todo' && s !== 'inProgress' && s !== 'waiting' && s !== 'done' && s !== 'canceled');
        // Wait, if I filter out 'todo' etc, then legacy tasks won't show. 
        // Let's just include EVERYTHING in the set, but maybe sort defaults first.

        // Better approach: defaults first, then others sorted alpha.
        const custom = Object.keys(tasksByStatus).filter(s => !DEFAULT_STATUSES.includes(s as any) && !['todo', 'inProgress', 'waiting', 'done', 'canceled'].includes(s));

        // Also include the legacy lower-case ones if they have tasks so they aren't hidden
        const legacy = ['todo', 'inProgress', 'waiting', 'done', 'canceled'].filter(s => tasksByStatus[s] && tasksByStatus[s].length > 0);

        return [...DEFAULT_STATUSES, ...legacy, ...custom];
    }, [tasksByStatus]);

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

                        {/* Right Sidebar: Action Items & Notes */}
                        <div className="w-80 border-l border-gray-100 bg-gray-50/30 flex flex-col overflow-y-auto custom-scrollbar p-5 space-y-6">
                            {/* Tasks Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                        <h3 className="text-sm font-bold text-gray-800">Action Items</h3>
                                    </div>
                                    {/* Removed header plus button for better discoverability below */}
                                </div>

                                {/* Prominent Add Task Button or Input */}
                                {isAddingTask ? (
                                    <div className="bg-white rounded-xl p-3 shadow-md border border-blue-200 mb-3 space-y-2 animate-in slide-in-from-top-2 duration-200 ring-2 ring-blue-50/50">
                                        <textarea
                                            className="w-full text-xs text-gray-800 placeholder-gray-400 focus:outline-none resize-none leading-relaxed"
                                            placeholder="Write your task here..."
                                            rows={3}
                                            value={newTaskContent}
                                            onChange={(e) => setNewTaskContent(e.target.value)}
                                            autoFocus
                                            style={{ minHeight: '60px' }}
                                        />
                                        <div className="flex justify-between items-center pt-2 border-t border-gray-50 mt-1">
                                            <button
                                                onClick={handleAddTaskFromEmail}
                                                className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center space-x-1"
                                                title="Import message subject and preview"
                                            >
                                                <Mail size={12} />
                                                <span className="font-medium">Import from Email</span>
                                            </button>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => setIsAddingTask(false)}
                                                    className="text-[11px] text-gray-400 hover:text-gray-600 font-medium px-2 py-1"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSaveNewTask}
                                                    disabled={!newTaskContent.trim()}
                                                    className="text-[11px] bg-black text-white px-3 py-1 rounded-lg font-bold hover:bg-gray-800 transition-colors disabled:opacity-50"
                                                >
                                                    Add Item
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAddingTask(true)}
                                        className="w-full py-2.5 bg-white border border-dashed border-gray-300 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-center space-x-2 group"
                                    >
                                        <Plus size={14} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-semibold">Add Action Item</span>
                                    </button>
                                )}

                                <div className="space-y-4 pt-1">
                                    {allStatuses.map(status => {
                                        const items = tasksByStatus[status] || [];
                                        if (items.length === 0 && !DEFAULT_STATUSES.includes(status as any)) return null;

                                        return (
                                            <div key={status} className="space-y-2">
                                                {(items.length > 0 || DEFAULT_STATUSES.includes(status as any)) && (
                                                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pl-1">
                                                        {(status === 'todo' ? 'To Do' : status === 'inProgress' ? 'In Progress' : status === 'waiting' ? 'Waiting' : status === 'done' ? 'Done' : status === 'canceled' ? 'Canceled' : status)}
                                                    </div>
                                                )}
                                                <div className="space-y-2">
                                                    {items.map((task: MiniTask) => (
                                                        <div key={task.id} className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 group hover:shadow-md transition-all relative ${['Done', 'Canceled', 'done', 'canceled'].includes(task.status) ? 'opacity-60 bg-gray-50' : ''}`}>

                                                            {/* Main Text Content */}
                                                            <div className={`text-xs text-gray-800 mb-3 leading-relaxed whitespace-pre-wrap font-medium ${['Done', 'Canceled', 'done', 'canceled'].includes(task.status) ? 'line-through text-gray-400' : ''}`}>
                                                                {task.title}
                                                            </div>

                                                            {/* Action Row: Status Pill + Delete */}
                                                            <div className="flex items-center justify-end space-x-2">

                                                                {/* Status Pill */}
                                                                <div className="relative inline-block">
                                                                    <select
                                                                        value={task.status}
                                                                        onChange={(e) => updateMiniTaskStatus(task.id, e.target.value)}
                                                                        className={`appearance-none text-[10px] font-bold uppercase tracking-wider py-1 px-2.5 pr-6 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors
                                                                            ${task.status === 'todo' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' :
                                                                                task.status === 'inProgress' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' :
                                                                                    task.status === 'waiting' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' :
                                                                                        task.status === 'done' ? 'bg-green-50 text-green-600 hover:bg-green-100' :
                                                                                            'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                                            }
                                                                        `}
                                                                    >
                                                                        {allStatuses.map(s => (
                                                                            <option key={s} value={s}>{s}</option>
                                                                        ))}
                                                                        <option disabled>──────────</option>
                                                                        <option value="__CREATE_NEW__">+ New Status</option>
                                                                    </select>
                                                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                        <ChevronDown size={10} className="text-current opacity-50" />
                                                                    </div>
                                                                </div>

                                                                {/* Delete Button (Visible on hover or touch) */}
                                                                <button
                                                                    onClick={() => handleDeleteTask(task.id)}
                                                                    className="text-gray-300 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {Object.values(tasksByStatus).flat().length === 0 && !isAddingTask && (
                                        <div className="py-8 flex flex-col items-center justify-center text-center opacity-50">
                                            <span className="text-xs text-gray-400 mb-1">No tasks yet</span>
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
                                            <div
                                                key={item.id}
                                                onClick={() => setSelectedNote(item)}
                                                className="bg-white p-2.5 rounded-lg shadow-sm border border-yellow-100/50 group relative pr-7 cursor-pointer hover:shadow-md transition-all"
                                            >
                                                <div className="font-semibold text-xs text-gray-800">{item.title}</div>
                                                {item.description && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteNote(item.id); }}
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

                    {/* Note Detail Modal */}
                    {selectedNote && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/10 backdrop-blur-sm animate-fade-in">
                            <div className="absolute inset-0" onClick={() => setSelectedNote(null)}></div>
                            <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl ring-1 ring-black/5 animate-scale-in relative z-10 flex flex-col max-h-[80vh]">
                                <div className="flex-none flex items-center justify-between mb-4">
                                    <input
                                        className="text-xl font-bold text-gray-900 bg-transparent focus:outline-none w-full mr-4 placeholder-gray-300"
                                        value={selectedNote.title}
                                        onChange={(e) => handleUpdateNote(selectedNote.id, { title: e.target.value })}
                                        placeholder="Note Title"
                                    />
                                    <button
                                        onClick={() => setSelectedNote(null)}
                                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto min-h-[200px]">
                                    <textarea
                                        className="w-full h-full text-sm text-gray-600 leading-relaxed bg-transparent focus:outline-none resize-none placeholder-gray-300"
                                        value={selectedNote.description}
                                        onChange={(e) => handleUpdateNote(selectedNote.id, { description: e.target.value })}
                                        placeholder="Start typing details..."
                                    />
                                </div>
                                <div className="flex-none pt-4 border-t border-gray-100 mt-4 flex justify-end">
                                    <button
                                        onClick={() => setSelectedNote(null)}
                                        className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
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
