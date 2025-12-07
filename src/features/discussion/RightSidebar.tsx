import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Plus, Calendar, AlertCircle, Trash2, ChevronDown, ChevronRight, X, GripVertical } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DragStartEvent,
    DragEndEvent,
    useDraggable,
    useDroppable
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { remindersService, Reminder } from '../reminders/remindersService';
import { taskService } from '../tasks/taskService';
import { Task } from '../tasks/types';
import { Status, Priority } from '../../types/shared';
import { ConfirmModal } from '../../ui/ConfirmModal';
import { DatePicker } from '../tasks/components/DatePicker';

interface RightSidebarProps {
    className?: string;
    contextId?: string;
}

const DraggableTaskItem: React.FC<{ task: Task; onToggleStatus: (t: Task) => void; onDelete: (t: Task, e: React.MouseEvent) => void }> = ({ task, onToggleStatus, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task.id,
        data: { type: 'task', task }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        touchAction: 'none'
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative mb-2"
        >
            <div className="flex items-start gap-3">
                <div {...attributes} {...listeners} className="mt-1 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                    <GripVertical size={14} />
                </div>
                <button onClick={() => onToggleStatus(task)} className={`mt-0.5 transition-colors ${task.status === Status.Complete ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    {task.status === Status.Complete ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </button>
                <div className="flex-1 min-w-0 pr-6">
                    <h4 className={`text-sm font-medium text-gray-900 truncate ${task.status === Status.Complete ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        {task.dueDate && (
                            <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                <Calendar size={10} />
                                {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        )}
                        {task.priority === Priority.High && (
                            <span className="flex items-center gap-1 text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                <AlertCircle size={10} />
                                High
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <button
                onClick={(e) => onDelete(task, e)}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded bg-white opacity-0 group-hover:opacity-100 transition-all"
                title="Delete"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );
};

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    const colors = {
        [Priority.Urgent]: 'bg-red-100 text-red-700',
        [Priority.High]: 'bg-orange-100 text-orange-700',
        [Priority.Normal]: 'bg-blue-100 text-blue-700',
        [Priority.Low]: 'bg-gray-100 text-gray-600',
        [Priority.None]: 'bg-gray-50 text-gray-500'
    };
    return (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[priority]}`}>
            {priority}
        </span>
    );
};

const DroppableSection: React.FC<{ id: string; title: string; count: number; children: React.ReactNode; defaultOpen?: boolean }> = ({ id, title, count, children, defaultOpen = true }) => {
    const { setNodeRef, isOver } = useDroppable({ id });
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div ref={setNodeRef} className={`mb-4 rounded-lg transition-colors ${isOver ? 'bg-blue-50/50 ring-2 ring-blue-500/20' : ''}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:bg-gray-100 p-1.5 rounded transition-colors"
                type="button"
            >
                {isOpen ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                {title} <span className="ml-2 text-gray-400 bg-gray-100 px-1.5 rounded-full text-[10px]">{count}</span>
            </button>
            {isOpen && <div className="space-y-1 px-1 pb-2 min-h-[50px]">{children}</div>}
        </div>
    );
};

export const RightSidebar: React.FC<RightSidebarProps> = ({ className = '', contextId }) => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'reminders'>('tasks');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'task' | 'reminder', title: string } | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);

    // Add logic state
    const [isAdding, setIsAdding] = useState(false);
    const [newItemPriority, setNewItemPriority] = useState<Priority>(Priority.Normal);
    const [newItemDate, setNewItemDate] = useState<string | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    useEffect(() => {
        loadData();
        const unsubscribeReminders = remindersService.subscribe(loadReminders);
        return () => unsubscribeReminders();
    }, [contextId]);

    // Internal toggle removed - using prop

    const loadData = async () => {
        setIsLoading(true);
        await Promise.all([loadTasks(), loadReminders()]);
        setIsLoading(false);
    };

    const loadTasks = async () => {
        try {
            const fetched = await taskService.getTasks(undefined, contextId);
            setTasks(fetched);
        } catch (error) {
            console.error('Failed to load tasks', error);
        }
    };

    const loadReminders = () => {
        const fetched = remindersService.getReminders(contextId);
        setReminders(fetched);
    };

    const handleAddItem = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newItemTitle.trim()) return;

        if (activeTab === 'tasks') {
            try {
                await taskService.createTask({
                    title: newItemTitle,
                    status: Status.Todo,
                    priority: newItemPriority,
                    dueDate: newItemDate,
                    assignees: [],
                    tags: [],
                    spaceId: contextId || 'default'
                });
                setNewItemTitle('');
                setNewItemPriority(Priority.Normal);
                setNewItemDate(undefined);
                loadTasks();
            } catch (error) {
                console.error('Failed to create task', error);
            }
        } else {
            remindersService.addReminder({
                title: newItemTitle,
                priority: newItemPriority === Priority.Normal ? 'medium' : newItemPriority.toLowerCase() as any,
                dueDate: newItemDate,
                listId: contextId || 'inbox',
                tags: [],
                completed: false,
                subtasks: []
            });
            setNewItemTitle('');
            setNewItemPriority(Priority.Normal);
            setNewItemDate(undefined);
        }
        setIsAdding(false);
    };

    const renderAddItem = () => {
        if (!isAdding) {
            return (
                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full flex items-center p-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-dashed border-gray-300 hover:border-gray-400"
                >
                    <Plus size={16} className="mr-2" />
                    Add new {activeTab === 'tasks' ? 'Task' : 'Reminder'}
                </button>
            );
        }

        return (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 animate-in slide-in-from-top-2 duration-200">
                <input
                    type="text"
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    placeholder={`What needs to be done?`}
                    className="w-full text-sm font-medium border-none p-0 focus:ring-0 placeholder:text-gray-400 mb-3"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddItem();
                        if (e.key === 'Escape') setIsAdding(false);
                    }}
                />

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="relative">
                            <button
                                onClick={() => setShowDatePicker(!showDatePicker)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${newItemDate ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                            >
                                <Calendar size={12} />
                                <span>{newItemDate ? new Date(newItemDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Date'}</span>
                            </button>
                            {showDatePicker && (
                                <div className="absolute top-full left-0 mt-2 z-50">
                                    <DatePicker
                                        date={newItemDate}
                                        onSelect={setNewItemDate}
                                        onClose={() => setShowDatePicker(false)}
                                        className="w-[280px] shadow-xl"
                                        compact={true}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="relative group">
                            <button
                                className={`flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium transition-colors ${newItemPriority === Priority.High || newItemPriority === Priority.Urgent ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                <AlertCircle size={12} />
                                <span>{newItemPriority}</span>
                            </button>
                            <div className="absolute top-full left-0 mt-1 w-32 bg-white rounded-lg shadow-xl border border-gray-100 hidden group-hover:block z-50 overflow-hidden">
                                {Object.values(Priority).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setNewItemPriority(p)}
                                        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors"
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleAddItem()}
                            disabled={!newItemTitle.trim()}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Add
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const confirmDeletion = async () => {
        if (!itemToDelete) return;

        if (itemToDelete.type === 'task') {
            await taskService.deleteTask(itemToDelete.id);
            loadTasks();
        } else {
            remindersService.deleteReminder(itemToDelete.id);
        }
        setItemToDelete(null);
    };

    const handleDeleteTask = (task: Task, e: React.MouseEvent) => {
        e.stopPropagation();
        setItemToDelete({ id: task.id, type: 'task', title: task.title });
    };

    const handleDeleteReminder = (reminder: Reminder, e: React.MouseEvent) => {
        e.stopPropagation();
        setItemToDelete({ id: reminder.id, type: 'reminder', title: reminder.title });
    };

    const toggleTaskStatus = async (task: Task) => {
        const nextStatus = task.status === Status.Complete ? Status.Todo : Status.Complete;
        await taskService.updateTask(task.id, { status: nextStatus });
        loadTasks();
    };

    const toggleReminderStatus = (reminder: Reminder) => {
        remindersService.updateReminder(reminder.id, { completed: !reminder.completed });
    };

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeTask = tasks.find(t => t.id === active.id);
        if (!activeTask) return;

        const containerId = over.id as string;
        let newStatus: Status | null = null;

        if (containerId === 'todo-section') newStatus = Status.Todo;
        else if (containerId === 'processing-section') newStatus = Status.InProgress;
        else if (containerId === 'done-section') newStatus = Status.Complete;

        if (newStatus && newStatus !== activeTask.status) {
            setTasks(prev => prev.map(t =>
                t.id === activeTask.id ? { ...t, status: newStatus! } : t
            ));

            try {
                await taskService.updateTask(activeTask.id, { status: newStatus });
            } catch (error) {
                console.error("Failed to move task", error);
                loadTasks();
            }
        }
    };

    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const todoTasks = safeTasks.filter(t => t.status === Status.Todo);
    const processingTasks = safeTasks.filter(t => t.status === Status.InProgress || t.status === Status.Review);
    const doneTasks = safeTasks.filter(t => t.status === Status.Complete);

    const safeReminders = Array.isArray(reminders) ? reminders : [];
    const todoReminders = safeReminders.filter(r => !r.completed);
    const doneReminders = safeReminders.filter(r => r.completed);

    const renderReminderItem = (reminder: Reminder) => (
        <div key={reminder.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative mb-2">
            <div className="flex items-start gap-3">
                <button onClick={() => toggleReminderStatus(reminder)} className={`mt-0.5 transition-colors ${reminder.completed ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
                    {reminder.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </button>
                <div className="flex-1 min-w-0 pr-6">
                    <h4 className={`text-sm font-medium text-gray-900 truncate ${reminder.completed ? 'line-through text-gray-400' : ''}`}>
                        {reminder.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        {reminder.time && (
                            <span className="flex items-center gap-1">
                                <Clock size={10} />
                                {reminder.time}
                            </span>
                        )}
                        {reminder.listId && (
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600 capitalize">
                                {reminder.listId}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <button
                onClick={(e) => handleDeleteReminder(reminder, e)}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded bg-white opacity-0 group-hover:opacity-100 transition-all"
                title="Delete"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );

    const renderTasksContent = () => (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <DroppableSection id="todo-section" title="To Do" count={todoTasks.length}>
                {todoTasks.map(task => (
                    <DraggableTaskItem key={task.id} task={task} onToggleStatus={toggleTaskStatus} onDelete={handleDeleteTask} />
                ))}
            </DroppableSection>

            <DroppableSection id="processing-section" title="Processing" count={processingTasks.length}>
                {processingTasks.map(task => (
                    <DraggableTaskItem key={task.id} task={task} onToggleStatus={toggleTaskStatus} onDelete={handleDeleteTask} />
                ))}
            </DroppableSection>

            <DroppableSection id="done-section" title="Done" count={doneTasks.length} defaultOpen={false}>
                {doneTasks.map(task => (
                    <DraggableTaskItem key={task.id} task={task} onToggleStatus={toggleTaskStatus} onDelete={handleDeleteTask} />
                ))}
            </DroppableSection>

            <DragOverlay>
                {activeId ? (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );

    return (
        <>
            <div className={`w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-full ${className}`}>
                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'tasks' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Project Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('reminders')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'reminders' ? 'border-black text-black' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Reminders
                    </button>

                </div>

                {/* Add New Item */}
                <div className="p-4 bg-white border-b border-gray-200">
                    {renderAddItem()}

                    {/* List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {isLoading ? (
                            <div className="p-4 text-center text-gray-400 text-sm">Loading...</div>
                        ) : activeTab === 'tasks' ? (
                            tasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-gray-400 text-sm opacity-60">
                                    <Circle size={32} className="mb-2" />
                                    <p>No tasks yet</p>
                                </div>
                            ) : (
                                renderTasksContent()
                            )
                        ) : (
                            reminders.length === 0 ? (
                                <div className="flex flex-col items-center justify-center p-8 text-gray-400 text-sm opacity-60">
                                    <Clock size={32} className="mb-2" />
                                    <p>No reminders yet</p>
                                </div>
                            ) : (
                                <>
                                    <DroppableSection id="reminders-todo" title="To Do" count={todoReminders.length}>
                                        {todoReminders.map(renderReminderItem)}
                                    </DroppableSection>
                                    <DroppableSection id="reminders-done" title="Done" count={doneReminders.length} defaultOpen={false}>
                                        {doneReminders.map(renderReminderItem)}
                                    </DroppableSection>
                                </>
                            )
                        )}
                    </div>
                </div>

                <ConfirmModal
                    isOpen={!!itemToDelete}
                    onClose={() => setItemToDelete(null)}
                    onConfirm={confirmDeletion}
                    title={`Delete ${itemToDelete?.type === 'task' ? 'Task' : 'Reminder'}`}
                    message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
                    confirmText="Delete"
                    variant="danger"
                />
            </div>
        </>
    );
};
