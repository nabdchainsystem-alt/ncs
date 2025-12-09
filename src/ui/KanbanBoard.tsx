import React, { useState, useRef, useEffect } from 'react';
import {
    Calendar, Flag, Tag, MoreHorizontal, Copy, Link2,
    Pencil, ArrowRight, Bell, Mail, Plus, GitMerge, Move, Timer,
    LayoutTemplate, Archive, Trash2, Slash, ChevronRight, ChevronLeft,
    ArrowLeftToLine, Zap, CheckSquare, Circle, CornerDownLeft,
    Search, Filter, SlidersHorizontal, Layout, UserCircle, CheckCircle2,
    X, Info, ChevronDown, Users, MessageSquare, Clock
} from 'lucide-react';

// --- Types ---

export type Priority = 'urgent' | 'high' | 'normal' | 'low' | 'none';

export interface Subtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    statusId: string;
    priority: Priority;
    dueDate?: string;
    tags: string[];
    subtasks: Subtask[];
    assignee?: string;
}

export interface ColumnType {
    id: string;
    title: string;
    color: string; // Tailwind color class base (e.g., 'gray', 'pink', 'green')
    icon?: string;
}

export interface BoardData {
    columns: ColumnType[];
    tasks: Task[];
}

// --- Constants ---

export const INITIAL_DATA: BoardData = {
    columns: [
        { id: 'todo', title: 'TO DO', color: 'gray' },
        { id: 'in-progress', title: 'DFS', color: 'pink' },
        { id: 'complete', title: 'COMPLETE', color: 'emerald' },
    ],
    tasks: [
        {
            id: 't1',
            title: 'Design System',
            statusId: 'todo',
            priority: 'high',
            dueDate: 'Oct 24',
            tags: ['Design'],
            subtasks: [],
            assignee: 'M'
        },
        {
            id: 't2',
            title: 'API Integration',
            statusId: 'in-progress',
            priority: 'urgent',
            tags: ['Dev', 'Backend'],
            subtasks: [
                { id: 's1', title: 'Subtask 1', completed: true },
                { id: 's2', title: 'Subtask 2', completed: false }
            ],
            assignee: 'A'
        },
        {
            id: 't3',
            title: 'User Testing',
            statusId: 'complete',
            priority: 'low',
            tags: ['QA'],
            subtasks: [],
            assignee: 'J'
        }
    ]
};

export const priorityConfig = {
    urgent: { color: 'text-red-500', icon: Flag, label: 'Urgent' },
    high: { color: 'text-orange-500', icon: Flag, label: 'High' },
    normal: { color: 'text-blue-500', icon: Flag, label: 'Normal' },
    low: { color: 'text-gray-500', icon: Flag, label: 'Low' },
    none: { color: 'text-gray-400', icon: Flag, label: 'Clear' }
};

// --- Sub-Components (Menus, etc.) ---

const MenuItem = ({ icon: Icon, label, hasSubmenu = false }: { icon: any, label: string, hasSubmenu?: boolean }) => (
    <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between text-sm text-gray-700 group">
        <div className="flex items-center gap-3">
            <Icon size={16} className="text-gray-400 group-hover:text-gray-600" />
            <span>{label}</span>
        </div>
        {hasSubmenu && <ChevronRight size={14} className="text-gray-400" />}
    </button>
);

export const PriorityMenu = ({ currentPriority, onSelect }: { currentPriority: Priority, onSelect: (p: Priority | 'clear') => void }) => {
    return (
        <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Priority</div>
            <button onClick={() => onSelect('urgent')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                <Flag size={16} className="text-red-500 fill-current" /> Urgent
            </button>
            <button onClick={() => onSelect('high')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                <Flag size={16} className="text-orange-500 fill-current" /> High
            </button>
            <button onClick={() => onSelect('normal')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                <Flag size={16} className="text-blue-500 fill-current" /> Normal
            </button>
            <button onClick={() => onSelect('low')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                <Flag size={16} className="text-gray-500" /> Low
            </button>
            <div className="h-px bg-gray-100 my-1"></div>
            <button onClick={() => onSelect('clear')} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                <Slash size={16} className="text-gray-400" /> Clear
            </button>
            <div className="mt-2 pt-2 border-t border-gray-100 px-4 pb-2">
                <div className="text-xs text-gray-500 mb-2">Add to Personal Priorities</div>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">MA</div>
                    <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"><Plus size={14} /></button>
                </div>
            </div>
        </div>
    );
};

export const TagMenu = ({ tags, onUpdateTags }: { tags: string[], onUpdateTags: (tags: string[]) => void }) => {
    const [tagInput, setTagInput] = useState('');

    const handleAddTag = (e: React.FormEvent) => {
        e.preventDefault();
        if (tagInput.trim()) {
            onUpdateTags([...tags, tagInput.trim()]);
            setTagInput('');
        }
    };

    return (
        <div className="p-2">
            <input
                autoFocus
                type="text"
                placeholder="Search or add tags..."
                className="w-full px-3 py-2 bg-gray-50 rounded-md border-none text-sm focus:ring-1 focus:ring-indigo-500 outline-none mb-2"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag(e)}
            />
            <div className="max-h-48 overflow-y-auto">
                {tags.length === 0 && !tagInput ? (
                    <div className="text-center py-6 text-gray-400 text-sm italic">No tags created</div>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs flex items-center gap-1">
                                {tag}
                                <button onClick={() => onUpdateTags(tags.filter(t => t !== tag))} className="hover:text-indigo-900">×</button>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const MiniCalendar = ({ selectedDate, onSelect, onClear }: { selectedDate?: string, onSelect: (date: string) => void, onClear: () => void }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const dateStr = `${monthNames[currentDate.getMonth()].substring(0, 3)} ${day}`;
        onSelect(dateStr);
    };

    return (
        <div className="p-3 w-64">
            <div className="flex items-center justify-between mb-3">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft size={16} /></button>
                <span className="text-sm font-semibold text-gray-700">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight size={16} /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                    <div key={day} className="text-[10px] text-gray-400 font-medium">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${monthNames[currentDate.getMonth()].substring(0, 3)} ${day}`;
                    const isSelected = selectedDate === dateStr;
                    return (
                        <button
                            key={day}
                            onClick={() => handleDateClick(day)}
                            className={`h-7 w-7 rounded-full text-xs flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between">
                <button onClick={() => {
                    const now = new Date();
                    const dateStr = `${monthNames[now.getMonth()].substring(0, 3)} ${now.getDate()}`;
                    onSelect(dateStr);
                }} className="text-xs text-indigo-600 font-medium hover:text-indigo-800">Today</button>
                <button onClick={onClear} className="text-xs text-gray-400 hover:text-red-500">Clear</button>
            </div>
        </div>
    );
};

// --- TaskCard Component ---

interface TaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onUpdateTask: (updatedTask: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onDuplicateTask: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onDragStart, onUpdateTask, onDeleteTask, onDuplicateTask }) => {
    const [activeMenu, setActiveMenu] = useState<'none' | 'priority' | 'tags' | 'context' | 'date'>('none');
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameTitle, setRenameTitle] = useState(task.title);

    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setActiveMenu('none');
            }
        };
        if (activeMenu !== 'none') {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeMenu]);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isRenaming]);

    const handleRenameSubmit = () => {
        if (renameTitle.trim()) {
            onUpdateTask({ ...task, title: renameTitle });
        } else {
            setRenameTitle(task.title);
        }
        setIsRenaming(false);
    };

    const currentPriorityKey = task.priority;

    return (
        <div
            draggable={!isRenaming}
            onDragStart={(e) => {
                if (activeMenu !== 'none' || isRenaming) {
                    e.preventDefault();
                    return;
                }
                onDragStart(e, task.id);
            }}
            className="group relative bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3 z-0"
        >
            <div className="flex justify-between items-start mb-3 group/header">
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 text-sm font-medium text-gray-900 border border-indigo-300 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                    />
                ) : (
                    <span className="font-medium text-gray-900 text-sm leading-snug block flex-1 pr-2 break-words">{task.title}</span>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenu('context'); }}
                    className={`p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-all ${activeMenu === 'context' ? 'opacity-100 bg-gray-100' : 'opacity-0 group-hover/header:opacity-100'}`}
                >
                    <MoreHorizontal size={16} />
                </button>
            </div>

            <div className="flex items-center gap-2 relative">
                {/* Calendar Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenu('date'); }}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${task.dueDate ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-gray-400'}`}
                >
                    <Calendar size={14} strokeWidth={2.5} />
                </button>
                {task.dueDate && (
                    <span className="text-[10px] text-gray-500 font-medium -ml-1 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{task.dueDate}</span>
                )}

                {/* Priority Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenu('priority'); }}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${task.priority !== 'none' ? priorityConfig[currentPriorityKey].color : 'text-gray-400'}`}
                >
                    <Flag size={14} strokeWidth={2.5} fill={task.priority !== 'none' && task.priority !== 'low' ? "currentColor" : "none"} />
                </button>

                {/* Tag Button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenu('tags'); }}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${task.tags.length > 0 ? 'text-indigo-500' : 'text-gray-400'}`}
                >
                    <Tag size={14} strokeWidth={2.5} />
                </button>
            </div>

            {/* Tag List */}
            {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {task.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">{tag}</span>
                    ))}
                </div>
            )}

            {/* Popups / Menus */}
            {activeMenu !== 'none' && (
                <div
                    ref={menuRef}
                    className="absolute left-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden"
                    style={{
                        top: '100%',
                        left: '0',
                        minWidth: activeMenu === 'date' ? 'auto' : '16rem',
                        width: activeMenu === 'date' ? 'auto' : '16rem'
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {activeMenu === 'priority' && (
                        <PriorityMenu
                            currentPriority={task.priority}
                            onSelect={(p) => {
                                onUpdateTask({ ...task, priority: p === 'clear' ? 'none' : p });
                                setActiveMenu('none');
                            }}
                        />
                    )}

                    {activeMenu === 'tags' && (
                        <TagMenu
                            tags={task.tags}
                            onUpdateTags={(newTags) => {
                                onUpdateTask({ ...task, tags: newTags });
                            }}
                        />
                    )}

                    {activeMenu === 'date' && (
                        <MiniCalendar
                            selectedDate={task.dueDate}
                            onSelect={(date) => {
                                onUpdateTask({ ...task, dueDate: date });
                                setActiveMenu('none');
                            }}
                            onClear={() => {
                                onUpdateTask({ ...task, dueDate: undefined });
                                setActiveMenu('none');
                            }}
                        />
                    )}

                    {/* Task Context Menu */}
                    {activeMenu === 'context' && (
                        <div className="w-64">
                            <div className="flex items-center justify-between p-2 border-b border-gray-100">
                                <button className="flex-1 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded text-center">Copy link</button>
                                <div className="w-px h-4 bg-gray-200"></div>
                                <button className="flex-1 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded text-center">Copy ID</button>
                                <div className="w-px h-4 bg-gray-200"></div>
                                <button className="flex-1 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 rounded text-center">New tab</button>
                            </div>
                            <div className="py-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                <button onClick={() => { setActiveMenu('none'); setIsRenaming(true); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                                    <Pencil size={16} className="text-gray-400" /> Rename
                                </button>
                                <MenuItem icon={ArrowRight} label="Convert to" hasSubmenu />
                                <MenuItem icon={LayoutTemplate} label="Task Type" hasSubmenu />
                                <button onClick={() => { onDuplicateTask(task); setActiveMenu('none'); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                                    <Copy size={16} className="text-gray-400" /> Duplicate
                                </button>
                                <MenuItem icon={Timer} label="Remind me" />
                                <MenuItem icon={Bell} label="Follow task" />
                                <MenuItem icon={Mail} label="Send email to task" />
                                <MenuItem icon={Plus} label="Add To" hasSubmenu />
                                <MenuItem icon={GitMerge} label="Merge" />
                                <MenuItem icon={Move} label="Move" />
                                <MenuItem icon={Timer} label="Start timer" />
                                <div className="h-px bg-gray-100 my-1"></div>
                                <MenuItem icon={Link2} label="Dependencies" hasSubmenu />
                                <MenuItem icon={LayoutTemplate} label="Templates" hasSubmenu />
                                <div className="h-px bg-gray-100 my-1"></div>
                                <MenuItem icon={Archive} label="Archive" />
                                <button onClick={() => onDeleteTask(task.id)} className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-3 text-sm text-red-600">
                                    <Trash2 size={16} /> Delete
                                </button>
                            </div>
                            <div className="p-2 border-t border-gray-100">
                                <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded transition-colors">
                                    Sharing & Permissions
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Column Component ---

interface ColumnProps {
    column: ColumnType;
    tasks: Task[];
    onTaskMove: (taskId: string, newStatusId: string) => void;
    onAddTask: (statusId: string, title: string, overrides?: Partial<Task>) => void;
    onUpdateTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onDuplicateTask: (task: Task) => void;
    onClearColumn: (columnId: string) => void;
    onRenameColumn: (columnId: string, newTitle: string) => void;
    onColorChange: (columnId: string, color: string) => void;
}

// Rich Task Creation Form Component
const TaskCreationForm = ({ onSave, onCancel }: { onSave: (title: string, priority: Priority, tags: string[], date?: string) => void, onCancel: () => void }) => {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<Priority>('none');
    const [tags, setTags] = useState<string[]>([]);
    const [date, setDate] = useState<string | undefined>(undefined);

    const [activePopup, setActivePopup] = useState<'none' | 'date' | 'priority' | 'tags'>('none');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                onCancel();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onCancel]);

    const handleSave = () => {
        if (title.trim()) {
            onSave(title, priority, tags, date);
        } else {
            onCancel();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            if (activePopup !== 'none') {
                setActivePopup('none');
            } else {
                onCancel();
            }
        }
    };

    return (
        <div ref={containerRef} className="p-3 bg-white rounded-xl shadow-lg border-2 border-indigo-500 mb-3 relative z-10">
            <div className="flex items-center gap-2 mb-3">
                <input
                    autoFocus
                    type="text"
                    placeholder="Task Name..."
                    className="flex-1 outline-none text-sm font-medium text-gray-900 placeholder:text-gray-400 bg-transparent"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    onClick={handleSave}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                    Save <CornerDownLeft size={12} />
                </button>
            </div>

            <div className="flex gap-3 relative">
                <button
                    onClick={() => setActivePopup(activePopup === 'date' ? 'none' : 'date')}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${date ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Calendar size={14} />
                    {date ? date : 'Add dates'}
                </button>

                <button
                    onClick={() => setActivePopup(activePopup === 'priority' ? 'none' : 'priority')}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${priority !== 'none' ? priorityConfig[priority].color : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Flag size={14} fill={priority !== 'none' && priority !== 'low' ? "currentColor" : "none"} />
                    {priority !== 'none' ? priorityConfig[priority].label : 'Add priority'}
                </button>

                <button
                    onClick={() => setActivePopup(activePopup === 'tags' ? 'none' : 'tags')}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${tags.length > 0 ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Tag size={14} />
                    {tags.length > 0 ? `${tags.length} tags` : 'Add tag'}
                </button>
            </div>

            {/* Popups */}
            {activePopup !== 'none' && (
                <div
                    className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden"
                    style={{ minWidth: '16rem' }}
                >
                    {activePopup === 'date' && (
                        <MiniCalendar
                            selectedDate={date}
                            onSelect={(d) => { setDate(d); setActivePopup('none'); }}
                            onClear={() => { setDate(undefined); setActivePopup('none'); }}
                        />
                    )}
                    {activePopup === 'priority' && (
                        <PriorityMenu
                            currentPriority={priority}
                            onSelect={(p) => {
                                setPriority(p === 'clear' ? 'none' : p);
                                setActivePopup('none');
                            }}
                        />
                    )}
                    {activePopup === 'tags' && (
                        <TagMenu
                            tags={tags}
                            onUpdateTags={(newTags) => setTags(newTags)}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

const Column: React.FC<ColumnProps> = ({
    column, tasks, onTaskMove, onAddTask, onUpdateTask,
    onDeleteTask, onDuplicateTask, onClearColumn, onRenameColumn, onColorChange
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [isAddingBottom, setIsAddingBottom] = useState(false);
    const [isAddingTop, setIsAddingTop] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameTitle, setRenameTitle] = useState(column.title);

    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isRenaming]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            onTaskMove(taskId, column.id);
        }
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleRenameSubmit = () => {
        if (renameTitle.trim()) {
            onRenameColumn(column.id, renameTitle);
        } else {
            setRenameTitle(column.title);
        }
        setIsRenaming(false);
    };

    const getBadgeStyle = (color: string) => {
        const map: Record<string, string> = {
            gray: 'bg-gray-100 text-gray-700',
            blue: 'bg-blue-600 text-white',
            green: 'bg-green-600 text-white',
            yellow: 'bg-yellow-500 text-white',
            orange: 'bg-orange-500 text-white',
            red: 'bg-red-600 text-white',
            pink: 'bg-pink-600 text-white',
            purple: 'bg-purple-600 text-white',
            emerald: 'bg-emerald-600 text-white',
        };
        return map[color] || map['gray'];
    };

    if (isCollapsed) {
        return (
            <div className="flex-shrink-0 w-12 h-full pt-3 flex flex-col items-center bg-gray-50 border-r border-gray-100">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="p-2 hover:bg-gray-200 rounded text-gray-500 mb-4"
                    title="Expand"
                >
                    <ArrowLeftToLine size={20} className="rotate-180" />
                </button>
                <div className="writing-vertical-lr transform rotate-180 text-sm font-bold text-gray-500 tracking-wide uppercase">
                    {column.title}
                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-gray-200 text-xs text-gray-600">{tasks.length}</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex-shrink-0 w-80 flex flex-col h-full rounded-xl transition-colors duration-200 ${isDragOver ? 'bg-gray-50' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-1 py-3 mb-2 relative group/col-header">
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        className="w-full text-sm font-bold uppercase tracking-wide border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit()}
                    />
                ) : (
                    <div className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide shadow-sm flex items-center gap-2 ${getBadgeStyle(column.color)}`}>
                        {column.title}
                        <span className="opacity-80 font-normal">{tasks.length}</span>
                    </div>
                )}

                <div className="flex gap-1 relative opacity-0 group-hover/col-header:opacity-100 transition-opacity">
                    <button
                        onClick={() => setIsAddingTop(!isAddingTop)}
                        className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${isAddingTop ? 'bg-gray-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Plus size={16} />
                    </button>
                    <button
                        className={`p-1.5 hover:bg-gray-100 rounded transition-colors ${showMenu ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:text-gray-600'}`}
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <MoreHorizontal size={16} />
                    </button>

                    {/* Column Menu */}
                    {showMenu && (
                        <div
                            ref={menuRef}
                            className="absolute right-0 top-full mt-1 w-60 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden"
                        >
                            <div className="py-2">
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500">Color</div>
                                <div className="px-4 py-2 flex gap-2 flex-wrap">
                                    {['gray', 'blue', 'green', 'yellow', 'orange', 'red', 'pink', 'purple', 'emerald'].map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => onColorChange(column.id, c)}
                                            className={`w-5 h-5 rounded-full hover:scale-110 transition-transform ${c === 'gray' ? 'bg-gray-200' : `bg-${c}-500`} ${column.color === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                                            title={c}
                                        />
                                    ))}
                                </div>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500">Group options</div>
                                <button onClick={() => { setIsCollapsed(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                                    <ArrowLeftToLine size={16} className="text-gray-400" /> Collapse group
                                </button>
                                <button onClick={() => { onClearColumn(column.id); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                                    <Archive size={16} className="text-gray-400" /> Archive all in this group
                                </button>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                                    <Zap size={16} className="text-gray-400" /> Automate status
                                </button>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                                    <CheckSquare size={16} className="text-gray-400" /> Select all
                                </button>
                                <button onClick={() => { setIsRenaming(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                                    <Pencil size={16} className="text-gray-400" /> Rename
                                </button>
                                <button className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-sm text-gray-700">
                                    <Circle size={16} className="text-gray-400" /> Edit statuses
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto px-1 scrollbar-default pb-4">

                {isAddingTop && (
                    <TaskCreationForm
                        onSave={(title, priority, tags, date) => {
                            onAddTask(column.id, title, { priority, tags, dueDate: date });
                            setIsAddingTop(false);
                        }}
                        onCancel={() => setIsAddingTop(false)}
                    />
                )}

                {tasks.map(task => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        onDragStart={handleDragStart}
                        onUpdateTask={onUpdateTask}
                        onDeleteTask={onDeleteTask}
                        onDuplicateTask={onDuplicateTask}
                    />
                ))}

                {isAddingBottom ? (
                    <TaskCreationForm
                        onSave={(title, priority, tags, date) => {
                            onAddTask(column.id, title, { priority, tags, dueDate: date });
                            setIsAddingBottom(false);
                        }}
                        onCancel={() => setIsAddingBottom(false)}
                    />
                ) : (
                    <button
                        onClick={() => setIsAddingBottom(true)}
                        className="w-full py-2 flex items-center gap-2 text-emerald-700 hover:text-emerald-800 text-sm font-medium pl-2 transition-colors hover:bg-emerald-50 rounded-lg mt-1"
                    >
                        <Plus size={18} />
                        Add Task
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Main KanbanBoard Component ---

interface KanbanBoardProps {
    storageKey?: string;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ storageKey }) => {
    const [data, setData] = useState<BoardData>(() => {
        if (storageKey) {
            try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    // Validate structure
                    if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.tasks)) {
                        return parsed;
                    }
                }
            } catch (e) {
                console.error('Failed to load kanban data', e);
            }
        }
        return INITIAL_DATA;
    });

    useEffect(() => {
        if (storageKey) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(data));
            } catch (e) {
                console.error('Failed to save kanban data', e);
            }
        }
    }, [data, storageKey]);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeHeaderMenu, setActiveHeaderMenu] = useState<'none' | 'sort' | 'filter' | 'assignee'>('none');
    const headerMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
                setActiveHeaderMenu('none');
            }
        };
        if (activeHeaderMenu !== 'none') {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [activeHeaderMenu]);

    const handleTaskMove = (taskId: string, newStatusId: string) => {
        setData(prev => {
            const updatedTasks = prev.tasks.map(task =>
                task.id === taskId ? { ...task, statusId: newStatusId } : task
            );
            return { ...prev, tasks: updatedTasks };
        });
    };

    const handleAddTask = (statusId: string, title: string, overrides?: Partial<Task>) => {
        const newTask: Task = {
            id: `task-${Date.now()}`,
            title,
            statusId,
            priority: overrides?.priority || 'none',
            tags: overrides?.tags || [],
            subtasks: [],
            dueDate: overrides?.dueDate,
            ...overrides
        };

        setData(prev => ({
            ...prev,
            tasks: [...prev.tasks, newTask]
        }));
    };

    const handleUpdateTask = (updatedTask: Task) => {
        setData(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
        }));
    };

    const handleDeleteTask = (taskId: string) => {
        setData(prev => ({
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== taskId)
        }));
    };

    const handleDuplicateTask = (task: Task) => {
        const newTask = { ...task, id: `task-${Date.now()}`, title: `${task.title} (Copy)` };
        setData(prev => ({
            ...prev,
            tasks: [...prev.tasks, newTask]
        }));
    };

    const handleClearColumn = (columnId: string) => {
        if (confirm('Are you sure you want to archive all tasks in this group?')) {
            setData(prev => ({
                ...prev,
                tasks: prev.tasks.filter(t => t.statusId !== columnId)
            }));
        }
    };

    const handleRenameColumn = (columnId: string, newTitle: string) => {
        setData(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === columnId ? { ...c, title: newTitle } : c)
        }));
    };

    const handleColorChange = (columnId: string, newColor: string) => {
        setData(prev => ({
            ...prev,
            columns: prev.columns.map(c => c.id === columnId ? { ...c, color: newColor } : c)
        }));
    };

    const filteredTasks = data.tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-screen bg-white text-gray-800 font-sans">
            {/* Top Header */}
            <header className="flex-none px-8 py-5 flex items-center justify-between bg-white z-20 relative">
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-xs font-semibold text-gray-700 transition-colors shadow-sm">
                        <Layout size={14} className="text-gray-500" />
                        Group: Status
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-xs font-semibold text-gray-700 transition-colors shadow-sm">
                        <GitMerge size={14} className="text-gray-500" />
                        Subtasks
                    </button>
                </div>

                <div className="flex items-center gap-3" ref={headerMenuRef}>
                    <div className="relative group mr-2">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 text-sm bg-gray-50 border border-transparent hover:border-gray-200 focus:border-indigo-200 focus:bg-white rounded-full outline-none w-56 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Sort Menu Trigger */}
                    <div className="relative">
                        <button
                            onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'sort' ? 'none' : 'sort')}
                            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${activeHeaderMenu === 'sort' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                            <SlidersHorizontal size={16} />
                            Sort
                        </button>
                        {activeHeaderMenu === 'sort' && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500">Sort By</div>
                                {[
                                    'Status', 'Task Name', 'Assignee', 'Priority', 'Due date', 'Start date',
                                    'Date created', 'Date updated', 'Date closed', 'Time tracked', 'Time estimate',
                                    'Total time in Status', 'Duration'
                                ].map(item => (
                                    <button key={item} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 block">
                                        {item}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter Menu Trigger */}
                    <div className="relative">
                        <button
                            onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'filter' ? 'none' : 'filter')}
                            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${activeHeaderMenu === 'filter' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                            <Filter size={16} />
                            Filter
                        </button>
                        {activeHeaderMenu === 'filter' && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                                        Filters <Info size={12} className="text-gray-400" />
                                    </div>
                                    <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                        Saved filters <ChevronDown size={12} />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between mb-2">
                                    <div className="relative flex-1 mr-2">
                                        <button className="w-full flex items-center justify-between px-3 py-1.5 bg-white border border-gray-300 rounded text-sm text-gray-600">
                                            Select filter <ChevronDown size={14} />
                                        </button>
                                    </div>
                                    <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-2 mb-4">
                                    <div className="relative mb-2">
                                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-blue-500" />
                                        <input type="text" placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded text-sm outline-none focus:border-blue-500" autoFocus />
                                    </div>
                                    <div className="space-y-0.5">
                                        {[
                                            { icon: CheckCircle2, label: 'Status' },
                                            { icon: Tag, label: 'Tags' },
                                            { icon: Calendar, label: 'Due date' },
                                            { icon: Flag, label: 'Priority' },
                                            { icon: UserCircle, label: 'Assignee' },
                                            { icon: Archive, label: 'Archived' },
                                            { icon: MessageSquare, label: 'Assigned comment' },
                                            { icon: UserCircle, label: 'Created by' },
                                            { icon: Calendar, label: 'Date closed' },
                                            { icon: Calendar, label: 'Date created' },
                                        ].map((item, i) => (
                                            <button key={i} className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 rounded text-sm text-gray-700">
                                                <item.icon size={14} className="text-gray-500" />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded border border-red-200">
                                        Clear all
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <button className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                        <CheckCircle2 size={16} />
                        Closed
                    </button>

                    {/* Assignee Menu Trigger */}
                    <div className="relative">
                        <button
                            onClick={() => setActiveHeaderMenu(activeHeaderMenu === 'assignee' ? 'none' : 'assignee')}
                            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${activeHeaderMenu === 'assignee' ? 'bg-gray-100 text-gray-800' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'}`}
                        >
                            <UserCircle size={16} />
                            Assignee
                        </button>
                        {activeHeaderMenu === 'assignee' && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900">Assignees</h3>
                                    <button onClick={() => setActiveHeaderMenu('none')} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="p-3">
                                    <div className="relative mb-4">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Search by user or team"
                                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="py-8 px-4 text-center">
                                        <p className="text-sm text-gray-500">
                                            No tasks have been assigned yet. Set assignees on tasks to get started.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center -space-x-2 ml-2">
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white border-2 border-white flex items-center justify-center text-xs font-bold">M</div>
                    </div>
                </div>
            </header>

            {/* Kanban Board Area */}
            <main className="flex-1 overflow-x-auto overflow-y-hidden px-8 pb-4 bg-white">
                <div className="flex h-full gap-10">
                    {data.columns.map(col => (
                        <Column
                            key={col.id}
                            column={col}
                            tasks={filteredTasks.filter(t => t.statusId === col.id)}
                            onTaskMove={handleTaskMove}
                            onAddTask={handleAddTask}
                            onUpdateTask={handleUpdateTask}
                            onDeleteTask={handleDeleteTask}
                            onDuplicateTask={handleDuplicateTask}
                            onClearColumn={handleClearColumn}
                            onRenameColumn={handleRenameColumn}
                            onColorChange={handleColorChange}
                        />
                    ))}

                    {/* Add Group Placeholder */}
                    <div className="flex-shrink-0 w-80 pt-3">
                        <button className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors group">
                            <Plus size={20} className="group-hover:bg-gray-100 rounded p-0.5" />
                            <span className="text-sm font-medium">Add group</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default KanbanBoard;
