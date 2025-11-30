import React, { useMemo, useState, useRef } from 'react';
import { Archive, Trash2, Reply, Send, Inbox, Plus, Paperclip, FileText } from 'lucide-react';
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

    return (
        <div className="flex-1 flex flex-col bg-white h-full min-w-0">
            <div className="flex-1 flex flex-col overflow-hidden">
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

                            {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <h3 className="text-xs font-semibold text-gray-500 mb-2">Attachments</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMessage.attachments.map(att => (
                                            <div key={att.id} className="flex items-center p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                                                <FileText size={16} className="text-gray-400 mr-2" />
                                                <span className="text-gray-700">{att.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Reply Area */}
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                            <div className="bg-white border border-gray-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-black transition-all">
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
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        <button
                                            className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100"
                                            title="Attach file"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Paperclip size={16} />
                                        </button>
                                    </div>
                                    <button
                                        onClick={onSendReply}
                                        disabled={!replyText.trim()}
                                        className="bg-[#1e2126] text-white px-4 py-1.5 rounded text-sm font-medium flex items-center space-x-2 disabled:opacity-50 hover:bg-[#2c3036] transition-all"
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
                            className="mt-6 px-6 py-2 bg-[#1e2126] text-white rounded-md font-medium shadow-lg shadow-gray-200 hover:shadow-xl hover:bg-[#2c3036] hover:scale-105 transition-all flex items-center"
                        >
                            <Plus size={16} className="mr-2" />
                            New Message
                        </button>
                    </div>
                )}
            </div>

            {/* Reminders / Mini tasks panel */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 border-t border-gray-100 p-4 bg-transparent">
                <div className="col-span-1 md:col-span-2 border border-gray-200 rounded-lg p-4 bg-white/50">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Reminders &amp; Notes</p>
                            <p className="text-xs text-gray-500">Lightweight scratchpad under your inbox.</p>
                        </div>
                        <button
                            onClick={() => setIsAddingReminder(prev => !prev)}
                            className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-100 transition"
                            title="Add reminder or note"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {isAddingReminder && (
                        <div className="space-y-2 mb-3">
                            <input
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-black"
                                placeholder="Headline"
                                value={reminderTitle}
                                onChange={(e) => setReminderTitle(e.target.value)}
                            />
                            <textarea
                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-black resize-none"
                                placeholder="Description"
                                rows={3}
                                value={reminderDescription}
                                onChange={(e) => setReminderDescription(e.target.value)}
                            />
                            <div className="flex items-center justify-end gap-2">
                                <button
                                    className="text-xs text-gray-500 px-3 py-1 rounded hover:bg-gray-100"
                                    onClick={() => {
                                        setIsAddingReminder(false);
                                        setReminderTitle('');
                                        setReminderDescription('');
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="text-xs bg-[#1e2126] text-white px-3 py-1 rounded hover:bg-[#2c3036] disabled:opacity-50"
                                    onClick={handleAddReminder}
                                    disabled={!reminderTitle.trim() && !reminderDescription.trim()}
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    )}

                    {!selectedMessage?.notes || selectedMessage.notes.length === 0 ? (
                        <p className="text-xs text-gray-500">No reminders yet. Use the + to add one.</p>
                    ) : (
                        <ul className="list-disc pl-4 space-y-2 text-sm text-gray-700">
                            {selectedMessage.notes.map(item => (
                                <li key={item.id}>
                                    <div className="font-semibold text-gray-800">{item.title}</div>
                                    {item.description && <p className="text-xs text-gray-600">{item.description}</p>}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="col-span-1 md:col-span-3 border border-gray-200 rounded-lg p-4 bg-white/50">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-800">Mini tasks from email</p>
                            <p className="text-xs text-gray-500">Turn messages into actionable tasks.</p>
                        </div>
                        <button
                            onClick={handleAddTaskFromEmail}
                            disabled={!selectedMessage}
                            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                        >
                            <Plus size={12} />
                            Add from email
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { key: 'todo', label: 'To Do' },
                            { key: 'inProgress', label: 'In Progress' },
                            { key: 'done', label: 'Done' },
                        ].map(col => (
                            <div key={col.key} className="border border-dashed border-gray-200 rounded-md p-3 bg-white/70 flex flex-col min-h-[140px]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-700">{col.label}</span>
                                    <span className="text-[10px] text-gray-500">{(tasksByStatus as any)[col.key].length}</span>
                                </div>
                                <div className="space-y-2 overflow-y-auto max-h-52 pr-1">
                                    {(tasksByStatus as any)[col.key].length === 0 ? (
                                        <p className="text-[11px] text-gray-400">No tasks</p>
                                    ) : (
                                        (tasksByStatus as any)[col.key].map((task: MiniTask) => (
                                            <div key={task.id} className="border border-gray-200 rounded p-2 bg-white shadow-sm">
                                                <div className="text-sm font-semibold text-gray-800">{task.title}</div>
                                                {task.description && (
                                                    <p className="text-[11px] text-gray-500 mt-1 overflow-hidden text-ellipsis">{task.description}</p>
                                                )}
                                                <div className="mt-2">
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => updateMiniTaskStatus(task.id, e.target.value as MiniTask['status'])}
                                                        className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-black"
                                                    >
                                                        <option value="todo">To Do</option>
                                                        <option value="inProgress">In Progress</option>
                                                        <option value="done">Done</option>
                                                    </select>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
