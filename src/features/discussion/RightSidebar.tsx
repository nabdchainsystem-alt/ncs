import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Clock, Plus, Calendar, AlertCircle, Trash2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { remindersService, Reminder } from '../reminders/remindersService';
import { taskService } from '../tasks/taskService';
import { Task } from '../tasks/types';
import { Status, Priority } from '../../types/shared';

interface RightSidebarProps {
    className?: string;
}

const CollapsibleSection = ({ title, count, children, defaultOpen = true }: { title: string, count: number, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    if (count === 0) return null;
    return (
        <div className="mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center w-full text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:bg-gray-100 p-1 rounded transition-colors"
            >
                {isOpen ? <ChevronDown size={14} className="mr-1" /> : <ChevronRight size={14} className="mr-1" />}
                {title} <span className="ml-2 text-gray-400 bg-gray-100 px-1.5 rounded-full text-[10px]">{count}</span>
            </button>
            {isOpen && <div className="space-y-2">{children}</div>}
        </div>
    );
};

export const RightSidebar: React.FC<RightSidebarProps> = ({ className }) => {
    const [activeTab, setActiveTab] = useState<'tasks' | 'reminders'>('tasks');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [newItemTitle, setNewItemTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadData();
        const unsubscribeReminders = remindersService.subscribe(loadReminders);
        return () => unsubscribeReminders();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        await Promise.all([loadTasks(), loadReminders()]);
        setIsLoading(false);
    };

    const loadTasks = async () => {
        try {
            const fetched = await taskService.getTasks();
            setTasks(fetched);
        } catch (error) {
            console.error('Failed to load tasks', error);
        }
    };

    const loadReminders = () => {
        const fetched = remindersService.getReminders();
        setReminders(fetched);
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemTitle.trim()) return;

        if (activeTab === 'tasks') {
            try {
                await taskService.createTask({
                    title: newItemTitle,
                    status: Status.Todo,
                    priority: Priority.Normal,
                    assignees: [],
                    tags: [],
                    spaceId: 'default'
                });
                setNewItemTitle('');
                loadTasks();
            } catch (error) {
                console.error('Failed to create task', error);
            }
        } else {
            remindersService.addReminder({
                title: newItemTitle,
                priority: 'medium',
                listId: 'inbox',
                tags: [],
                completed: false,
                subtasks: []
            });
            setNewItemTitle('');
        }
    };

    const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this task?')) {
            await taskService.deleteTask(id);
            loadTasks();
        }
    };

    const handleDeleteReminder = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Delete this reminder?')) {
            remindersService.deleteReminder(id);
        }
    };

    const toggleTaskStatus = async (task: Task) => {
        const nextStatus = task.status === Status.Complete ? Status.Todo : Status.Complete;
        await taskService.updateTask(task.id, { status: nextStatus });
        loadTasks();
    };

    const toggleReminderStatus = (reminder: Reminder) => {
        remindersService.updateReminder(reminder.id, { completed: !reminder.completed });
    };

    // Categorize Tasks
    const todoTasks = tasks.filter(t => t.status === Status.Todo);
    const processingTasks = tasks.filter(t => t.status === Status.InProgress || t.status === Status.Review);
    const doneTasks = tasks.filter(t => t.status === Status.Complete);

    // Categorize Reminders
    const todoReminders = reminders.filter(r => !r.completed);
    const doneReminders = reminders.filter(r => r.completed);

    const renderTaskItem = (task: Task) => (
        <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
            <div className="flex items-start gap-3">
                <button onClick={() => toggleTaskStatus(task)} className={`mt-0.5 transition-colors ${task.status === Status.Complete ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
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
                onClick={(e) => handleDeleteTask(task.id, e)}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded bg-white opacity-0 group-hover:opacity-100 transition-all"
                title="Delete"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );

    const renderReminderItem = (reminder: Reminder) => (
        <div key={reminder.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative">
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
                onClick={(e) => handleDeleteReminder(reminder.id, e)}
                className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded bg-white opacity-0 group-hover:opacity-100 transition-all"
                title="Delete"
            >
                <Trash2 size={14} />
            </button>
        </div>
    );

    return (
        <div className={`w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-full ${className}`}>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-white">
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'tasks'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    Project Tasks
                </button>
                <button
                    onClick={() => setActiveTab('reminders')}
                    className={`flex-1 py-3 text-sm font-medium text-center transition-colors ${activeTab === 'reminders'
                            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    Reminders
                </button>
            </div>

            {/* Add New Item */}
            <div className="p-4 bg-white border-b border-gray-200">
                <form onSubmit={handleAddItem} className="relative">
                    <input
                        type="text"
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        placeholder={`Add new ${activeTab === 'tasks' ? 'task' : 'reminder'}...`}
                        className="w-full pl-3 pr-10 py-2 bg-gray-100 border-none rounded-md text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newItemTitle.trim()}
                        className="absolute right-1 top-1 p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus size={18} />
                    </button>
                </form>
            </div>

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
                        <>
                            <CollapsibleSection title="To Do" count={todoTasks.length}>
                                {todoTasks.map(renderTaskItem)}
                            </CollapsibleSection>
                            <CollapsibleSection title="Processing" count={processingTasks.length}>
                                {processingTasks.map(renderTaskItem)}
                            </CollapsibleSection>
                            <CollapsibleSection title="Done" count={doneTasks.length} defaultOpen={false}>
                                {doneTasks.map(renderTaskItem)}
                            </CollapsibleSection>
                        </>
                    )
                ) : (
                    reminders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-8 text-gray-400 text-sm opacity-60">
                            <Clock size={32} className="mb-2" />
                            <p>No reminders yet</p>
                        </div>
                    ) : (
                        <>
                            <CollapsibleSection title="To Do" count={todoReminders.length}>
                                {todoReminders.map(renderReminderItem)}
                            </CollapsibleSection>
                            <CollapsibleSection title="Done" count={doneReminders.length} defaultOpen={false}>
                                {doneReminders.map(renderReminderItem)}
                            </CollapsibleSection>
                        </>
                    )
                )}
            </div>
        </div>
    );
};
