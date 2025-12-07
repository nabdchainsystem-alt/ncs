import React, { useState, useMemo } from 'react';
import {
    Calendar, CheckCircle2, Clock, Plus, Search,
    Inbox, Star, Flag, Hash, ChevronRight, ChevronDown, MoreHorizontal,
    Trash2, CalendarDays, Bell, Tag, AlignLeft, CheckSquare, List as ListIcon,
    LayoutGrid, Settings, X
} from 'lucide-react';

import { remindersService, Reminder, List } from '../../features/reminders/remindersService';
import { InputModal } from '../../ui/InputModal';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { DatePicker } from '../../features/tasks/components/DatePicker';
import { TimePicker } from '../../features/tasks/components/TimePicker';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableListItemProps {
    list: List;
    isActive: boolean;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    isLast: boolean;
}

const SortableListItem = ({ list, isActive, onClick, onDelete, isLast }: SortableListItemProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: list.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 100 : 'auto',
        opacity: isDragging ? 0.3 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <button
                onClick={onClick}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
            >
                <div className="flex items-center">
                    <div className={`w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center mr-3 ${list.color}`}>
                        <ListIcon size={14} />
                    </div>
                    <span className={isActive ? 'text-gray-900' : 'text-gray-700'}>{list.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-xs group-hover:hidden">{list.count}</span>
                    <div
                        onClick={onDelete}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded hidden group-hover:flex transition-colors"
                        title="Delete List"
                    >
                        <Trash2 size={14} />
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:hidden" />
                </div>
            </button>
        </div>
    );
};

const RemindersPage: React.FC = () => {
    const [activeListId, setActiveListId] = useState('all');
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
    // Load lists and reminders
    const [lists, setLists] = useState<List[]>([]);
    const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
    const [listToDeleteId, setListToDeleteId] = useState<string | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [tagInput, setTagInput] = useState('');
    const [datePickerPosition, setDatePickerPosition] = useState({ top: 0, left: 0 });
    const [timePickerPosition, setTimePickerPosition] = useState({ top: 0, left: 0 });
    const [datePickerTarget, setDatePickerTarget] = useState<'primary' | 'secondary' | null>(null);

    React.useEffect(() => {
        const fetchData = async () => {
            const l = await remindersService.getLists();
            const r = await remindersService.getReminders();
            setLists(l);
            setReminders(r);
        };
        fetchData();

        const unsubscribe = remindersService.subscribe(() => {
            fetchData();
        });

        // Request notification permission
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }

        return unsubscribe;
    }, []);

    // Helper functions for date logic
    const isDueToday = (dateStr?: string) => {
        if (!dateStr) return false;
        if (dateStr === 'Today') return true;
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    };

    const isScheduled = (dateStr?: string) => {
        if (!dateStr) return false;
        if (dateStr === 'Tomorrow' || dateStr === 'Next Week') return true;
        // Scheduled includes Today + Future in many apps, or just Future. 
        // Let's make it "Has a due date".
        return true;
    };

    // Notification Check
    React.useEffect(() => {
        const checkReminders = () => {
            const now = new Date();
            const currentIsoDate = now.toISOString().split('T')[0];
            const currentHours = now.getHours();
            const currentMinutes = now.getMinutes();

            reminders.forEach(r => {
                if (r.completed || !r.dueDate || !r.time) return;

                const isToday = r.dueDate === 'Today' || r.dueDate === currentIsoDate;

                if (isToday) {
                    const [h, m] = r.time.split(':').map(Number);
                    if (h === currentHours && m === currentMinutes) {
                        // Simple debounce to avoid multiple notifications in the same minute if re-rendered?
                        // Actually, this runs on interval. But if dependencies change, it might re-run.
                        // Ideally we check if we already notified for this ID-Time combo.
                        // For MVP, just fire. Browser might throttle duplicates.
                        if (Notification.permission === 'granted') {
                            new Notification(r.title, {
                                body: r.notes || 'Reminder due now',
                                icon: '/favicon.ico' // generic
                            });
                        }
                    }
                }
            });
        };

        // Check every minute
        const intervalId = setInterval(checkReminders, 60000);

        // Initial check in case we load exactly at the minute? Maybe skip to avoid noise on load.

        return () => clearInterval(intervalId);
    }, [reminders]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleNewList = () => {
        setIsNewListModalOpen(true);
    };

    const handleDeleteList = (id: string) => {
        setListToDeleteId(id);
    };

    const confirmDeleteList = () => {
        if (listToDeleteId) {
            remindersService.deleteList(listToDeleteId);
            setLists(prev => prev.filter(l => l.id !== listToDeleteId));
            if (activeListId === listToDeleteId) {
                setActiveListId('all');
            }
            setListToDeleteId(null);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setLists((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newLists = arrayMove(items, oldIndex, newIndex);
                // remindersService.saveLists(newLists); // TODO: Implement backend reordering
                return newLists;
            });
        }
    };

    const handleCreateList = async (name: string) => {
        const newList = await remindersService.addList({
            name,
            type: 'project',
            color: 'text-black'
        });
        setActiveListId(newList.id);
        setIsNewListModalOpen(false);
    };

    const handleAddReminder = (title: string) => {
        if (!title.trim()) return;

        // Determine the target list ID
        // If active list is a smart list, default to 'inbox' (or 'work' if 'inbox' doesn't exist, falling back to first available list)
        // If active list is a user list, use that.
        let targetListId = activeListId;
        const isSmartList = ['today', 'scheduled', 'all', 'flagged'].includes(activeListId);

        if (isSmartList) {
            // For now default to 'inbox' if it exists, otherwise the first list. 
            // Ideally we should have a default list setting.
            // Looking at initial reminders, there is an 'inbox' list id used, but it's not in the initial lists provided in the service?
            // The service INITIAL_LISTS are work, personal, shopping. 
            // Let's check if 'inbox' exists in lists, if not default to 'work' or the first one.
            const inboxExists = lists.some(l => l.id === 'inbox');
            targetListId = inboxExists ? 'inbox' : (lists[0]?.id || 'work');
        }

        remindersService.addReminder({
            title: title.trim(),
            listId: targetListId,
            dueDate: activeListId === 'today' ? 'Today' : undefined,
            time: undefined,
            priority: activeListId === 'flagged' ? 'high' : 'none',
            tags: [],
            completed: false,
            subtasks: []
        });
    };



    const handleDateClick = (e: React.MouseEvent, target: 'primary' | 'secondary') => {
        const rect = e.currentTarget.getBoundingClientRect();
        // Position relative to the window, but we need to consider if it goes off screen
        // For simplicity, let's place it to the left of the button
        setDatePickerPosition({ top: rect.top, left: rect.left - 520 }); // 520 = width of picker + nice gap
        setDatePickerTarget(target);
        setShowDatePicker(true);
    };

    const handleTimeClick = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTimePickerPosition({ top: rect.top, left: rect.left - 260 });
        setShowTimePicker(true);
    };

    const handleDateSelect = (date: string) => {
        if (selectedReminderId) {
            if (datePickerTarget === 'secondary') {
                remindersService.updateReminder(selectedReminderId, { secondaryDueDate: date });
            } else {
                remindersService.updateReminder(selectedReminderId, { dueDate: date });
            }
        }
    };

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim() && selectedReminderId) {
            const reminder = reminders.find(r => r.id === selectedReminderId);
            if (reminder && !reminder.tags.includes(tagInput.trim())) {
                remindersService.updateReminder(selectedReminderId, {
                    tags: [...reminder.tags, tagInput.trim()]
                });
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove: string) => {
        if (selectedReminderId) {
            const reminder = reminders.find(r => r.id === selectedReminderId);
            if (reminder) {
                remindersService.updateReminder(selectedReminderId, {
                    tags: reminder.tags.filter(t => t !== tagToRemove)
                });
            }
        }
    };

    const smartLists = useMemo(() => {
        const todayCount = reminders.filter(r => isDueToday(r.dueDate) && !r.completed).length;
        const scheduledCount = reminders.filter(r => r.dueDate && !r.completed).length; // All with due date
        const allCount = reminders.filter(r => !r.completed).length;
        const flaggedCount = reminders.filter(r => r.priority === 'high' && !r.completed).length;

        return [
            { id: 'all', name: 'All', icon: <Inbox size={24} />, count: allCount, color: 'bg-black', textColor: 'text-black' },
            { id: 'today', name: 'Today', icon: <CalendarDays size={24} />, count: todayCount, color: 'bg-black', textColor: 'text-black' },
            { id: 'scheduled', name: 'Scheduled', icon: <Calendar size={24} />, count: scheduledCount, color: 'bg-black', textColor: 'text-black' },
            { id: 'flagged', name: 'Flagged', icon: <Flag size={24} />, count: flaggedCount, color: 'bg-black', textColor: 'text-black' },
        ];
    }, [reminders]);

    const activeList = [...lists, ...smartLists].find(l => l.id === activeListId) || smartLists[2];

    const filteredReminders = reminders.filter(r => {
        if (searchQuery) return r.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeListId === 'all') return !r.completed;
        if (activeListId === 'today') return isDueToday(r.dueDate) && !r.completed;
        if (activeListId === 'scheduled') return r.dueDate && !r.completed;
        if (activeListId === 'flagged') return r.priority === 'high' && !r.completed;
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
        <div className="flex h-full w-full bg-transparent overflow-hidden font-sans">
            {/* Sidebar Navigation */}
            <div className="w-64 bg-stone-50/50 border-r border-stone-200 flex flex-col flex-shrink-0">
                <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 flex-shrink-0 bg-stone-50/50">
                    <h2 className="font-bold text-gray-800">Reminders</h2>
                </div>
                <div className="p-4 pb-2">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 focus:border-black focus:ring-0 rounded-xl text-sm transition-all placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 mt-2 space-y-6 custom-scrollbar">
                    {/* Smart Lists */}
                    <div>
                        <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Smart Lists</h3>
                        <div className="space-y-1">
                            {smartLists.map(list => (
                                <button
                                    key={list.id}
                                    onClick={() => setActiveListId(list.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group relative ${activeListId === list.id ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                                >
                                    <div className="flex items-center">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center mr-3 ${activeListId === list.id ? 'bg-white text-black' : 'bg-gray-100 text-gray-500'}`}>
                                            {list.icon && React.isValidElement(list.icon) ? React.cloneElement(list.icon as React.ReactElement<any>, { size: 14 }) : null}
                                        </div>
                                        <span className={activeListId === list.id ? 'text-gray-900' : 'text-gray-700'}>{list.name}</span>
                                    </div>
                                    <span className={`text-xs ${activeListId === list.id ? 'text-gray-900 font-bold' : 'text-gray-400 group-hover:text-gray-600'}`}>{list.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* My Lists */}
                    <div>
                        <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                            My Lists
                        </h3>
                        <div className="space-y-1">
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={lists}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {lists.map((list, index) => (
                                        <SortableListItem
                                            key={list.id}
                                            list={list}
                                            isActive={activeListId === list.id}
                                            onClick={() => setActiveListId(list.id)}
                                            onDelete={(e) => {
                                                e.stopPropagation();
                                                handleDeleteList(list.id);
                                            }}
                                            isLast={index === lists.length - 1}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 flex items-center justify-between text-gray-500">
                    <button onClick={handleNewList} className="flex items-center space-x-2 hover:text-black transition-colors">
                        <Plus size={18} />
                        <span className="text-sm font-medium">New List</span>
                    </button>

                </div>
            </div>

            {/* Main List Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-transparent relative z-10 ml-[-1px] border-l border-gray-200">
                {/* Header */}
                <div className="h-14 flex items-center justify-between px-4 flex-shrink-0 bg-white sticky top-0 z-20 border-b border-gray-100">
                    <div className="flex items-center">
                        <h1 className="text-lg font-bold text-gray-800">
                            {activeList.name}
                        </h1>
                        <span className="mx-2 text-gray-300">|</span>
                        <p className="text-sm text-gray-500 font-medium">{filteredReminders.length} reminders</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors">
                            <MoreHorizontal size={20} />
                        </button>
                    </div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto px-4 pb-20">
                    <div className="mx-auto space-y-1">
                        {filteredReminders.map(reminder => {
                            const hasSubtasks = reminder.subtasks && reminder.subtasks.length > 0;
                            const isExpanded = expandedReminderIds.has(reminder.id);

                            return (
                                <div key={reminder.id} className="group relative">
                                    <div
                                        onClick={() => setSelectedReminderId(reminder.id)}
                                        className={`flex items-start p-3 -mx-3 cursor-pointer rounded-xl transition-all duration-200 border ${selectedReminderId === reminder.id
                                            ? 'bg-blue-50/40 border-blue-200 shadow-sm'
                                            : 'hover:bg-gray-50 border-transparent'
                                            }`}
                                    >
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleComplete(reminder.id); }}
                                            className={`mt-0.5 w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-200 ${reminder.priority === 'high' ? 'border-black hover:bg-black/10' : 'border-gray-300 hover:border-black hover:bg-black/5'
                                                }`}
                                        >
                                            {/* Checkbox circle */}
                                        </button>

                                        <div className="ml-4 flex-1 min-w-0 border-b border-gray-100 pb-3 group-last:border-none">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[15px] font-medium truncate ${reminder.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                    {reminder.title}
                                                </span>
                                                {reminder.priority === 'high' && (
                                                    <Flag size={12} className="text-black fill-black ml-2 flex-shrink-0" />
                                                )}
                                            </div>

                                            {(reminder.notes || reminder.dueDate || reminder.secondaryDueDate || reminder.tags.length > 0) && (
                                                <div className="flex items-center mt-1 space-x-3 text-xs text-gray-500">
                                                    {reminder.dueDate && (
                                                        <span className={`flex items-center ${reminder.dueDate === 'Today' ? 'text-black font-bold' : 'text-gray-500'}`}>
                                                            {reminder.dueDate}
                                                            {reminder.time && <span className="ml-1 font-normal text-gray-400">at {new Date(`2000-01-01T${reminder.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>}
                                                        </span>
                                                    )}
                                                    {reminder.secondaryDueDate && (
                                                        <span className="text-red-500 font-medium">
                                                            Due {reminder.secondaryDueDate}
                                                        </span>
                                                    )}
                                                    {reminder.notes && <span className="truncate max-w-[300px]">{reminder.notes}</span>}
                                                    {reminder.tags.map(tag => (
                                                        <span key={tag} className="text-gray-600">#{tag}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Quick Add Placeholder */}
                        <div className="flex items-center p-3 -mx-3 text-gray-400 hover:text-gray-600 cursor-text group" onClick={() => {
                            const input = document.getElementById('quick-add-input');
                            input?.focus();
                        }}>
                            <Plus size={20} className="mr-4" />
                            <input
                                id="quick-add-input"
                                type="text"
                                placeholder="New Reminder"
                                className="bg-transparent border-none focus:ring-0 p-0 text-[15px] placeholder-gray-400 w-full"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleAddReminder(e.currentTarget.value);
                                        e.currentTarget.value = '';
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Inspector Panel (Floating) */}
            {
                selectedReminder && (
                    <div className="w-[320px] bg-white border-l border-gray-200 flex flex-col animate-in slide-in-from-right-10 duration-300 z-20 shadow-[-10px_0_30px_-10px_rgba(0,0,0,0.05)]">
                        <div className="p-4 flex items-center justify-between border-b border-gray-100 bg-white sticky top-0">
                            <span className="text-sm font-bold text-gray-900">Details</span>
                            <button
                                onClick={() => setSelectedReminderId(null)}
                                className="text-black font-medium text-sm hover:text-gray-700"
                            >
                                Done
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-3">
                                <div className="flex items-start space-x-3">
                                    <button
                                        onClick={() => toggleComplete(selectedReminder.id)}
                                        className={`mt-1 w-5 h-5 rounded-full border-[1.5px] flex-shrink-0 ${selectedReminder.priority === 'high' ? 'border-black' : 'border-gray-300'}`}
                                    ></button>
                                    <textarea
                                        value={selectedReminder.title}
                                        onChange={(e) => remindersService.updateReminder(selectedReminder.id, { title: e.target.value })}
                                        className="w-full text-base font-semibold text-gray-900 border-none focus:ring-0 p-0 bg-transparent resize-none h-auto min-h-[24px]"
                                        rows={2}
                                    />
                                </div>
                                <div className="pl-8">
                                    <textarea
                                        value={selectedReminder.notes || ''}
                                        onChange={(e) => remindersService.updateReminder(selectedReminder.id, { notes: e.target.value })}
                                        placeholder="Add notes"
                                        className="w-full text-sm text-gray-500 border-none focus:ring-0 p-0 bg-transparent resize-none min-h-[60px]"
                                    />
                                </div>
                            </div>

                            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 divide-y divide-gray-100">
                                <div
                                    className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer relative"
                                    onClick={(e) => handleDateClick(e, 'primary')}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white">
                                            <Calendar size={14} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">Date</span>
                                    </div>
                                    <span className={`text-sm ${selectedReminder.dueDate ? 'text-black' : 'text-gray-400'}`}>
                                        {selectedReminder.dueDate || 'Add Date'}
                                    </span>
                                </div>
                                <div
                                    className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer relative"
                                    onClick={(e) => handleDateClick(e, 'secondary')}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white">
                                            <Calendar size={14} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">Due Date</span>
                                    </div>
                                    <span className={`text-sm ${selectedReminder.secondaryDueDate ? 'text-black' : 'text-gray-400'}`}>
                                        {selectedReminder.secondaryDueDate || 'Add Due Date'}
                                    </span>
                                </div>
                                <div
                                    className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={handleTimeClick}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white">
                                            <Clock size={14} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">Time</span>
                                    </div>
                                    <span className={`text-sm ${selectedReminder.time ? 'text-black' : 'text-gray-400'}`}>
                                        {selectedReminder.time ? new Date(`2000-01-01T${selectedReminder.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Add Time'}
                                    </span>
                                </div>
                                <div className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white">
                                            <Flag size={14} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">Priority</span>
                                    </div>
                                    <select
                                        value={selectedReminder.priority}
                                        onChange={(e) => remindersService.updateReminder(selectedReminder.id, { priority: e.target.value as any })}
                                        className="text-sm text-gray-500 border-none focus:ring-0 bg-transparent text-right pr-8 cursor-pointer"
                                    >
                                        <option value="none">None</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 divide-y divide-gray-100">
                                <div className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white">
                                            <Tag size={14} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">Tags</span>
                                    </div>
                                    <div className="flex items-center flex-wrap gap-1 justify-end max-w-[200px]">
                                        {selectedReminder.tags.map(tag => (
                                            <span key={tag} className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded flex items-center">
                                                {tag}
                                                <button onClick={() => removeTag(tag)} className="ml-1 hover:text-red-500"><X size={10} /></button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                            placeholder="Add Tags"
                                            className="text-sm text-gray-500 border-none focus:ring-0 bg-transparent text-right min-w-[60px] p-0 placeholder-gray-400"
                                        />
                                    </div>
                                </div>
                                <div className="p-3 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center text-white">
                                            <ListIcon size={14} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">List</span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {lists.find(l => l.id === selectedReminder.listId)?.name || 'Inbox'}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-900">Subtasks</span>
                                    <button className="text-black hover:bg-gray-100 p-1 rounded"><Plus size={14} /></button>
                                </div>
                                <div className="space-y-2">
                                    {selectedReminder.subtasks.map(sub => (
                                        <div key={sub.id} className="flex items-center group">
                                            <div className={`w-4 h-4 border rounded-full mr-3 ${sub.completed ? 'bg-black border-black' : 'border-gray-300'}`}></div>
                                            <span className={`text-sm ${sub.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{sub.title}</span>
                                        </div>
                                    ))}
                                    {selectedReminder.subtasks.length === 0 && (
                                        <p className="text-xs text-gray-400 italic">No subtasks</p>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    remindersService.deleteReminder(selectedReminder.id);
                                    setSelectedReminderId(null);
                                }}
                                className="w-full py-3 text-red-600 bg-white rounded-xl font-medium shadow-sm border border-gray-200 hover:bg-red-50 transition-colors"
                            >
                                Delete Reminder
                            </button>
                        </div>
                    </div>
                )
            }

            {showDatePicker && (
                <div
                    style={{ position: 'fixed', top: datePickerPosition.top, left: datePickerPosition.left, zIndex: 50 }}
                >
                    <DatePicker
                        date={
                            datePickerTarget === 'secondary'
                                ? (selectedReminder?.secondaryDueDate && selectedReminder.secondaryDueDate !== 'Today' ? selectedReminder.secondaryDueDate : undefined)
                                : (selectedReminder?.dueDate && selectedReminder.dueDate !== 'Today' ? selectedReminder.dueDate : undefined)
                        }
                        onSelect={handleDateSelect}
                        onClose={() => setShowDatePicker(false)}
                    />
                </div>
            )}

            {showTimePicker && (
                <div
                    style={{ position: 'fixed', top: timePickerPosition.top, left: timePickerPosition.left, zIndex: 50 }}
                >
                    <TimePicker
                        time={selectedReminder?.time}
                        onSelect={(time) => {
                            if (selectedReminderId) {
                                remindersService.updateReminder(selectedReminderId, { time });
                            }
                        }}
                        onClose={() => setShowTimePicker(false)}
                    />
                </div>
            )}

            <InputModal
                isOpen={isNewListModalOpen}
                onClose={() => setIsNewListModalOpen(false)}
                onConfirm={handleCreateList}
                title="Create New List"
                placeholder="List Name"
                confirmText="Create List"
            />

            <ConfirmModal
                isOpen={!!listToDeleteId}
                onClose={() => setListToDeleteId(null)}
                onConfirm={confirmDeleteList}
                title="Delete List"
                message="Are you sure you want to delete this list? This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export default RemindersPage;
