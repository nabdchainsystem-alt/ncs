import React, { useState } from 'react';
import {
    Plus,
    Search,
    Filter,
    MoreHorizontal,
    Calendar,
    Clock,
    Tag,
    ChevronRight,
    Star,
    Inbox,
    Briefcase,
    CheckCircle2,
    Circle,
    Layout,
    ArrowUpRight,
    Hash,
    Flag,
    AlignLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectsDashboardProps {
    roomId: string;
    viewId?: string;
}

// Mock Data Types
type Priority = 'low' | 'medium' | 'high';

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'done';
    priority: Priority;
    dueDate?: string;
    tags: string[];
    projectId: string;
}

interface Project {
    id: string;
    name: string;
    icon: React.ReactNode;
    count: number;
    category: 'area' | 'project';
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ roomId }) => {
    // State
    const [selectedProject, setSelectedProject] = useState<string>('inbox');
    const [selectedTask, setSelectedTask] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Mock Data
    const projects: Project[] = [
        { id: 'inbox', name: 'Inbox', icon: <Inbox size={18} strokeWidth={1.5} />, count: 4, category: 'area' },
        { id: 'today', name: 'Today', icon: <Star size={18} strokeWidth={1.5} />, count: 2, category: 'area' },
        { id: 'upcoming', name: 'Upcoming', icon: <Calendar size={18} strokeWidth={1.5} />, count: 8, category: 'area' },
        { id: 'p1', name: 'Website Redesign', icon: <Layout size={18} strokeWidth={1.5} />, count: 12, category: 'project' },
        { id: 'p2', name: 'Q4 Marketing', icon: <Briefcase size={18} strokeWidth={1.5} />, count: 5, category: 'project' },
    ];

    const tasks: Task[] = [
        { id: 't1', title: 'Review wireframes', description: 'Check the new layout proposals.', status: 'todo', priority: 'high', projectId: 'p1', tags: ['design'], dueDate: 'Today' },
        { id: 't2', title: 'Update style guide', description: 'Add new stone color palette.', status: 'done', priority: 'medium', projectId: 'p1', tags: ['css'], dueDate: 'Yesterday' },
        { id: 't3', title: 'Draft newsletter', description: 'November updates for subscribers.', status: 'todo', priority: 'medium', projectId: 'p2', tags: ['writing'], dueDate: 'Tomorrow' },
        { id: 't4', title: 'Meeting with catch-up', description: '', status: 'todo', priority: 'low', projectId: 'inbox', tags: [], dueDate: 'Fri' },
    ];

    // Filtered Tasks
    const currentTasks = selectedProject === 'inbox'
        ? tasks
        : tasks.filter(t => t.projectId === selectedProject || selectedProject === 'all'); // simplified logic

    const activeTask = tasks.find(t => t.id === selectedTask);

    return (
        <div className="flex h-full w-full bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans transition-colors duration-300 overflow-hidden">

            {/* LEFT SIDEBAR (Projects) */}
            <motion.div
                initial={false}
                animate={{ width: sidebarOpen ? 260 : 0, opacity: sidebarOpen ? 1 : 0 }}
                className="flex-shrink-0 border-e border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 backdrop-blur-xl overflow-hidden flex flex-col"
            >
                <div className="p-4 flex items-center justify-between pointer-events-auto">
                    <h2 className="font-serif text-lg font-bold tracking-tight px-2">Journal</h2>
                </div>

                <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-6">
                    {/* Areas */}
                    <div className="space-y-1">
                        {projects.filter(p => p.category === 'area').map(project => (
                            <button
                                key={project.id}
                                onClick={() => setSelectedProject(project.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${selectedProject === project.id
                                    ? 'bg-stone-200/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 font-medium'
                                    : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={selectedProject === project.id ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400'}>
                                        {project.icon}
                                    </span>
                                    <span>{project.name}</span>
                                </div>
                                <span className="text-xs text-stone-400 font-mono">{project.count}</span>
                            </button>
                        ))}
                    </div>

                    <div className="h-px bg-stone-200 dark:bg-stone-800 mx-2" />

                    {/* Projects */}
                    <div>
                        <div className="px-3 mb-2 flex items-center justify-between group">
                            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider font-sans">Projects</h3>
                            <button className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={14} />
                            </button>
                        </div>
                        <div className="space-y-1">
                            {projects.filter(p => p.category === 'project').map(project => (
                                <button
                                    key={project.id}
                                    onClick={() => setSelectedProject(project.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${selectedProject === project.id
                                        ? 'bg-stone-200/50 dark:bg-stone-800/50 text-stone-900 dark:text-stone-100 font-medium'
                                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Hash size={16} strokeWidth={1.5} className={selectedProject === project.id ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400'} />
                                        <span>{project.name}</span>
                                    </div>
                                    <span className="text-xs text-stone-400 font-mono">{project.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* MIDDLE LIST PANE (Tasks) */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-stone-950/50">
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-stone-200 dark:border-stone-800 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors lg:hidden"
                        >
                            <Layout size={20} />
                        </button>
                        <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
                            {projects.find(p => p.id === selectedProject)?.name || 'Projects'}
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                            <Search size={18} />
                        </button>
                        <button className="p-2 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors">
                            <Filter size={18} />
                        </button>
                        <button className="px-3 py-1.5 bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 text-sm font-medium rounded-md shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                            <Plus size={16} />
                            New Task
                        </button>
                    </div>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto">
                    {currentTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-stone-400">
                            <Inbox size={48} className="mb-4 opacity-20" />
                            <p className="font-serif italic">No tasks found</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-stone-100 dark:divide-stone-800/50">
                            {currentTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={() => setSelectedTask(task.id)}
                                    className={`group px-6 py-4 flex items-start gap-4 cursor-pointer transition-colors ${selectedTask === task.id
                                        ? 'bg-stone-50 dark:bg-stone-900'
                                        : 'bg-white dark:bg-transparent hover:bg-stone-50 dark:hover:bg-stone-900/30'
                                        }`}
                                >
                                    <button className="mt-0.5 text-stone-300 hover:text-emerald-600 dark:text-stone-600 transition-colors flex-shrink-0">
                                        <Circle className="w-5 h-5" strokeWidth={1.5} />
                                    </button>

                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className={`text-base font-medium truncate ${task.status === 'done'
                                                ? 'text-stone-400 line-through'
                                                : 'text-stone-900 dark:text-stone-100'
                                                }`}>
                                                {task.title}
                                            </h4>
                                            {task.dueDate && (
                                                <span className={`text-xs ${selectedTask === task.id ? 'text-stone-500' : 'text-stone-400'
                                                    } flex items-center gap-1`}>
                                                    <Calendar size={12} />
                                                    {task.dueDate}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-stone-500 dark:text-stone-400 line-clamp-1 font-serif leading-relaxed">
                                            {task.description || "No description provided."}
                                        </p>

                                        <div className="flex items-center gap-3 pt-1">
                                            {task.tags.map(tag => (
                                                <span key={tag} className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded">
                                                    #{tag}
                                                </span>
                                            ))}
                                            {task.priority === 'high' && (
                                                <span className="text-xs text-rose-500 flex items-center gap-1">
                                                    <Flag size={10} className="fill-current" /> High
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity ${selectedTask === task.id ? 'opacity-100' : ''}`}>
                                        <ArrowUpRight size={16} className="text-stone-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT DETAIL PANE */}
            {selectedTask && (
                <div className="w-[400px] flex-shrink-0 border-s border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 overflow-y-auto hidden xl:block shadow-xl z-20">
                    {activeTask ? (
                        <div className="h-full flex flex-col">
                            {/* Detail Header */}
                            <div className="h-14 flex items-center justify-between px-6 border-b border-stone-100 dark:border-stone-800">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-stone-100 dark:bg-stone-800 text-stone-500">
                                        {activeTask.projectId}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-stone-400">
                                    <button className="hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
                                        <MoreHorizontal size={18} />
                                    </button>
                                    <button onClick={() => setSelectedTask(null)} className="hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
                                        <ArrowUpRight size={18} className="rotate-45" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-8 flex-1">
                                <div className="flex items-start gap-4 mb-6">
                                    <button className="mt-1 text-stone-300 hover:text-emerald-600 dark:text-stone-600 transition-colors">
                                        <Circle className="w-6 h-6" strokeWidth={1.5} />
                                    </button>
                                    <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 leading-tight">
                                        {activeTask.title}
                                    </h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="w-6 flex justify-center text-stone-400"><Calendar size={16} /></div>
                                            <span className="flex-1 text-stone-600 dark:text-stone-300">{activeTask.dueDate || 'No due date'}</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="w-6 flex justify-center text-stone-400"><Flag size={16} /></div>
                                            <span className="flex-1 text-stone-600 dark:text-stone-300 capitalize">{activeTask.priority} Priority</span>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="w-6 flex justify-center text-stone-400"><Tag size={16} /></div>
                                            <div className="flex-1 flex flex-wrap gap-2">
                                                {activeTask.tags.length > 0 ? activeTask.tags.map(tag => (
                                                    <span key={tag} className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-stone-600 dark:text-stone-300 text-xs">
                                                        {tag}
                                                    </span>
                                                )) : <span className="text-stone-400 italic">No tags</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-stone-100 dark:bg-stone-800 w-full" />

                                    <div className="prose prose-stone dark:prose-invert prose-sm">
                                        <div className="flex items-center gap-2 text-stone-500 mb-2">
                                            <AlignLeft size={16} />
                                            <span className="text-xs font-bold uppercase tracking-wider">Description</span>
                                        </div>
                                        <p className="text-stone-600 dark:text-stone-300 font-serif leading-relaxed">
                                            {activeTask.description || "No specific details added to this task."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center text-stone-500 text-xs font-bold">
                                        ME
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add a comment..."
                                        className="flex-1 bg-white dark:bg-stone-800 border-none rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-stone-300 dark:focus:ring-stone-600 placeholder:text-stone-400"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
};
