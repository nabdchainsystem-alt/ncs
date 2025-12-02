import React, { useState } from 'react';
import {
    Calendar, CheckCircle2, Clock, Plus, Search,
    Inbox, Star, Flag, Hash, ChevronRight, ChevronDown, MoreHorizontal,
    Trash2, CalendarDays, Bell, Tag, AlignLeft, CheckSquare
} from 'lucide-react';

import { remindersService, Reminder, List } from '../../features/reminders/remindersService';

const RemindersPage: React.FC = () => {
    const [activeListId, setActiveListId] = useState('inbox');
    const [selectedReminderId, setSelectedReminderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [expandedReminderIds, setExpandedReminderIds] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedReminderIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedReminderIds(newExpanded);
    };

    // Load reminders on mount and subscribe to changes
    React.useEffect(() => {
        setReminders(remindersService.getReminders());
        const unsubscribe = remindersService.subscribe(() => {
            setReminders(remindersService.getReminders());
        });
        return unsubscribe;
    }, []);

    // Mock Data for Lists (could also be moved to service later)
    const [lists] = useState<List[]>([
        { id: 'inbox', name: 'Inbox', icon: <Inbox size={18} />, type: 'smart', count: 4, color: 'text-blue-500' },
        { id: 'today', name: 'Today', icon: <Star size={18} />, type: 'smart', count: 2, color: 'text-yellow-500' },
        { id: 'upcoming', name: 'Upcoming', icon: <CalendarDays size={18} />, type: 'smart', count: 8, color: 'text-red-500' },
        { id: 'anytime', name: 'Anytime', icon: <Hash size={18} />, type: 'smart', count: 12, color: 'text-gray-500' },
        { id: 'work', name: 'Work Projects', icon: <CheckSquare size={18} />, type: 'project', count: 5, color: 'text-indigo-500' },
        { id: 'personal', name: 'Personal', icon: <CheckSquare size={18} />, type: 'project', count: 3, color: 'text-pink-500' },
    ]);

    const activeList = lists.find(l => l.id === activeListId) || lists[0];

    const filteredReminders = reminders.filter(r => {
        if (searchQuery) return r.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeListId === 'inbox') return r.listId === 'inbox' && !r.completed;
        if (activeListId === 'today') return r.dueDate === 'Today' && !r.completed;
        if (activeListId === 'upcoming') return (r.dueDate === 'Tomorrow' || r.dueDate === 'Next Week') && !r.completed;
        if (activeListId === 'anytime') return !r.dueDate && !r.completed;
        return r.listId === activeListId && !r.completed;
    });

    const selectedReminder = reminders.find(r => r.id === selectedReminderId);

    const toggleComplete = (id: string) => {
        const reminder = reminders.find(r => r.id === id);
        if (reminder) {
            remindersService.updateReminder(id, { completed: !reminder.completed });
        }
        if (selectedReminderId === id) setSelectedReminderId(null);
    };

    return (
        <div className="flex flex-col h-full w-full bg-white overflow-hidden">
            <div className="flex-1 flex min-h-0">
                {/* 1. Sidebar Navigation (260px) */}
                <div className="w-[260px] bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
                    <div className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-200/50 border-transparent focus:bg-white focus:border-blue-500 rounded-lg text-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 space-y-6">
                        {/* Smart Lists */}
                        <div className="space-y-0.5">
                            {lists.filter(l => l.type === 'smart').map(list => (
                                <button
                                    key={list.id}
                                    onClick={() => setActiveListId(list.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeListId === list.id ? 'bg-gray-200/80 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center">
                                        <span className={`mr-3 ${list.color}`}>{list.icon}</span>
                                        {list.name}
                                    </div>
                                    <span className="text-gray-400 text-xs">{list.count}</span>
                                </button>
                            ))}
                        </div>

                        {/* Projects */}
                        <div>
                            <h3 className="px-3 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">My Lists</h3>
                            <div className="space-y-0.5">
                                {lists.filter(l => l.type === 'project').map(list => (
                                    <button
                                        key={list.id}
                                        onClick={() => setActiveListId(list.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeListId === list.id ? 'bg-gray-200/80 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center">
                                            <span className={`mr-3 ${list.color}`}>{list.icon}</span>
                                            {list.name}
                                        </div>
                                        <span className="text-gray-400 text-xs">{list.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200">
                        <button className="flex items-center text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors">
                            <Plus size={18} className="mr-2" /> New List
                        </button>
                    </div>
                </div>

                {/* 2. Main List Area (Flex) */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                    {/* Header */}
                    <div className="h-16 border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0">
                        <div className="flex items-center">
                            <h1 className={`text-2xl font-bold ${activeList.color?.replace('text-', 'text-') || 'text-gray-900'}`}>
                                {activeList.name}
                            </h1>
                            <span className="ml-4 text-2xl font-bold text-gray-200">
                                {filteredReminders.length}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                                <MoreHorizontal size={20} />
                            </button>
                        </div>
                    </div>

                    {/* List Content */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-3xl mx-auto space-y-2">
                            {/* Quick Add */}
                            <div className="flex items-center p-3 mb-6 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                                <Plus size={20} className="text-gray-400 mr-3" />
                                <input
                                    type="text"
                                    placeholder="Add a task..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = e.currentTarget.value.trim();
                                            if (val) {
                                                remindersService.addReminder({
                                                    title: val,
                                                    listId: activeListId === 'upcoming' || activeListId === 'today' ? 'inbox' : activeListId,
                                                    dueDate: activeListId === 'today' ? 'Today' : undefined,
                                                    priority: 'none',
                                                    tags: [],
                                                    completed: false,
                                                    subtasks: []
                                                });
                                                e.currentTarget.value = '';
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {filteredReminders.map(reminder => {
                                const hasSubtasks = reminder.subtasks && reminder.subtasks.length > 0;
                                const isExpanded = expandedReminderIds.has(reminder.id);

                                return (
                                    <div key={reminder.id} className="group flex flex-col rounded-xl border border-transparent hover:border-gray-200 transition-all bg-white">
                                        <div
                                            onClick={() => setSelectedReminderId(reminder.id)}
                                            className={`flex items-start p-3 cursor-pointer rounded-xl transition-all ${selectedReminderId === reminder.id
                                                ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                : 'hover:bg-gray-50'
                                                }`}
                                        >
                                            {/* Expand/Collapse Arrow */}
                                            <div className="mr-2 mt-1">
                                                {hasSubtasks ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleExpand(reminder.id);
                                                        }}
                                                        className="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </button>
                                                ) : (
                                                    <div className="w-5" /> // Spacer
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleComplete(reminder.id); }}
                                                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${reminder.priority === 'high' ? 'border-red-400 hover:bg-red-50' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                                                    }`}
                                            >
                                                {/* Checkbox circle */}
                                            </button>
                                            <div className="ml-3 flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-sm font-medium truncate ${reminder.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                        {reminder.title}
                                                    </span>
                                                    {reminder.dueDate && (
                                                        <span className={`text-xs ${reminder.dueDate === 'Today' ? 'text-blue-600 font-medium' :
                                                            reminder.dueDate === 'Tomorrow' ? 'text-orange-500' : 'text-gray-400'
                                                            }`}>
                                                            {reminder.dueDate}
                                                        </span>
                                                    )}
                                                </div>
                                                {(reminder.notes || reminder.tags.length > 0) && (
                                                    <div className="flex items-center mt-1 space-x-2">
                                                        {reminder.notes && <span className="text-xs text-gray-500 truncate max-w-[200px]">{reminder.notes}</span>}
                                                        {reminder.tags.map(tag => (
                                                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md font-medium">#{tag}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Subtasks List */}
                                        {isExpanded && hasSubtasks && (
                                            <div className="pl-12 pr-4 pb-3 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                                {reminder.subtasks.map(sub => (
                                                    <div key={sub.id} className="flex items-center py-1 group/sub">
                                                        <div className={`w-3.5 h-3.5 border rounded mr-3 flex-shrink-0 ${sub.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}></div>
                                                        <span className={`text-sm truncate ${sub.completed ? 'text-gray-400 line-through' : 'text-gray-600'}`}>
                                                            {sub.title}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 3. Detail Inspector Panel (350px) */}
                {selectedReminder ? (
                    <div className="w-[350px] bg-white border-l border-gray-200 flex flex-col animate-in slide-in-from-right-10 duration-300 shadow-xl z-10">
                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="flex items-start space-x-3 mb-6">
                                <button
                                    onClick={() => toggleComplete(selectedReminder.id)}
                                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedReminder.priority === 'high' ? 'border-red-400' : 'border-gray-300'
                                        }`}
                                ></button>
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        value={selectedReminder.title}
                                        onChange={(e) => remindersService.updateReminder(selectedReminder.id, { title: e.target.value })}
                                        className="w-full text-xl font-bold text-gray-900 border-none focus:ring-0 p-0 bg-transparent placeholder-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Notes */}
                                <div className="group">
                                    <div className="flex items-center text-gray-500 mb-2">
                                        <AlignLeft size={16} className="mr-2" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Notes</span>
                                    </div>
                                    <textarea
                                        value={selectedReminder.notes || ''}
                                        onChange={(e) => remindersService.updateReminder(selectedReminder.id, { notes: e.target.value })}
                                        placeholder="Add notes..."
                                        className="w-full text-sm text-gray-600 bg-gray-50 border-transparent focus:bg-white focus:border-blue-500 rounded-lg resize-none min-h-[100px]"
                                    />
                                </div>

                                {/* Subtasks */}
                                <div>
                                    <div className="flex items-center text-gray-500 mb-2">
                                        <CheckSquare size={16} className="mr-2" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Subtasks</span>
                                    </div>
                                    <div className="space-y-2">
                                        {selectedReminder.subtasks.map(sub => (
                                            <div key={sub.id} className="flex items-center group">
                                                <div className={`w-4 h-4 border rounded mr-2 ${sub.completed ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}></div>
                                                <span className={`text-sm ${sub.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{sub.title}</span>
                                            </div>
                                        ))}
                                        <button className="flex items-center text-sm text-gray-400 hover:text-blue-600 transition-colors mt-2">
                                            <Plus size={14} className="mr-1" /> Add subtask
                                        </button>
                                    </div>
                                </div>

                                {/* Properties */}
                                <div className="space-y-4 pt-6 border-t border-gray-100">
                                    <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors">
                                        <div className="flex items-center text-gray-500">
                                            <Calendar size={16} className="mr-3" />
                                            <span className="text-sm">Due Date</span>
                                        </div>
                                        <span className={`text-sm font-medium ${selectedReminder.dueDate ? 'text-blue-600' : 'text-gray-400'}`}>
                                            {selectedReminder.dueDate || 'Set date'}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors">
                                        <div className="flex items-center text-gray-500">
                                            <Flag size={16} className="mr-3" />
                                            <span className="text-sm">Priority</span>
                                        </div>
                                        <span className={`text-sm font-medium ${selectedReminder.priority === 'high' ? 'text-red-600' :
                                            selectedReminder.priority === 'medium' ? 'text-orange-500' : 'text-gray-400'
                                            }`}>
                                            {selectedReminder.priority.charAt(0).toUpperCase() + selectedReminder.priority.slice(1)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded-lg transition-colors">
                                        <div className="flex items-center text-gray-500">
                                            <Tag size={16} className="mr-3" />
                                            <span className="text-sm">Tags</span>
                                        </div>
                                        <div className="flex space-x-1">
                                            {selectedReminder.tags.length > 0 ? (
                                                selectedReminder.tags.map(tag => (
                                                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{tag}</span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-400">Add tags</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
                            <span className="text-xs text-gray-400">Created today</span>
                            <button
                                onClick={() => {
                                    remindersService.deleteReminder(selectedReminder.id);
                                    setSelectedReminderId(null);
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-[350px] bg-gray-50 border-l border-gray-200 flex flex-col items-center justify-center text-gray-400">
                        <CheckCircle2 size={48} className="mb-4 opacity-20" />
                        <p className="text-sm">Select a task to view details</p>
                    </div>
                )}
            </div>


        </div >
    );
};

export default RemindersPage;
