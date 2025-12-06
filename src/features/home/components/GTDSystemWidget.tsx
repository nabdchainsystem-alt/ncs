import React, { useState } from 'react';
import {
    Inbox,
    CheckCircle2,
    Briefcase,
    Clock,
    Plus,
    MoreHorizontal,
    Search,
    ChevronRight,
    ArrowRight,
    FolderInput,
    ListChecks,
    Play,
    Calendar,
    Bell,
    Layers,
    CheckSquare,
    Zap
} from 'lucide-react';
import { GTDCapture } from './tools/GTDCapture';
import { GTDClarify } from './tools/GTDClarify';
import { GTDOrganize } from './tools/GTDOrganize';
import { GTDReview } from './tools/GTDReview';
import { GTDEngage } from './tools/GTDEngage';

// --- Types ---

export type GTDStatus = 'inbox' | 'actionable' | 'reference' | 'trash' | 'someday' | 'waiting' | 'done' | 'project';

export interface GTDItem {
    id: number;
    text: string;
    description?: string;
    status: GTDStatus;
    projectId?: number; // If it belongs to a project
    contextId?: string; // @office, @home, etc.
    energy?: 'High' | 'Medium' | 'Low';
    time?: '5m' | '15m' | '30m' | '1h+';
    dueDate?: number;
    delegatedTo?: string; // For Waiting For
    createdAt: number;
    parentId?: number; // If this task is a sub-step of a project item that hasn't been converted to a Project type yet, or linked to a Project
}

export interface Project {
    id: number;
    name: string;
    status: 'active' | 'planning' | 'completed' | 'someday';
    color?: string;
    items: number[]; // IDs of tasks in this project
}

export interface Context {
    id: string;
    name: string;
    icon: any;
}

// --- Main Widget ---

const ITEMS_STORAGE_KEY = 'gtd-system-items';
const PROJECTS_STORAGE_KEY = 'gtd-system-projects';

interface GTDSystemWidgetProps {
    userName?: string;
    onOpenQuickTask?: () => void;
    onOpenDiscussion?: () => void;
}

export const GTDSystemWidget: React.FC<GTDSystemWidgetProps> = ({
    userName = 'User',
    onOpenQuickTask,
    onOpenDiscussion
}) => {
    const [activeTab, setActiveTab] = useState<'capture' | 'clarify' | 'organize' | 'review' | 'engage'>('capture');

    // -- Data Initial State --
    const [items, setItems] = useState<GTDItem[]>(() => {
        try {
            const saved = localStorage.getItem(ITEMS_STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to load GTD items", e);
        }
        return [
            { id: 1, text: 'Call insurance company', status: 'inbox', createdAt: Date.now() },
            { id: 2, text: 'Brainstorm marketing ideas', status: 'inbox', createdAt: Date.now() - 1000 },
            { id: 3, text: 'Buy printer ink', status: 'actionable', contextId: 'errands', energy: 'Low', time: '30m', createdAt: Date.now() - 2000 },
            { id: 4, text: 'Review Q3 Financials', status: 'waiting', delegatedTo: 'Alice', createdAt: Date.now() - 5000 },
            { id: 5, text: 'Learn Spanish', status: 'someday', createdAt: Date.now() - 10000 },
        ];
    });

    const [projects, setProjects] = useState<Project[]>(() => {
        try {
            const saved = localStorage.getItem(PROJECTS_STORAGE_KEY);
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error("Failed to load GTD projects", e);
        }
        return [
            { id: 101, name: 'Q4 Marketing Strategy', status: 'active', items: [] },
            { id: 102, name: 'Office Renovation', status: 'planning', items: [] },
        ];
    });

    // Persistence Effects
    React.useEffect(() => {
        localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    React.useEffect(() => {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    }, [projects]);

    const [clarifyingId, setClarifyingId] = useState<number | null>(null);

    // -- Helpers --
    const inboxItems = items.filter(i => i.status === 'inbox').sort((a, b) => b.createdAt - a.createdAt);
    const nextActions = items.filter(i => i.status === 'actionable');
    const waitingFor = items.filter(i => i.status === 'waiting');
    const somedayItems = items.filter(i => i.status === 'someday');
    const referenceItems = items.filter(i => i.status === 'reference');

    const handleCapture = (text: string) => {
        const lowerText = text.toLowerCase();
        let status: GTDStatus = 'inbox';
        let cleanText = text;
        let isProject = false;

        if (lowerText.startsWith('@task ')) {
            status = 'actionable';
            cleanText = text.slice(6);
        } else if (lowerText.startsWith('@project ')) {
            isProject = true;
            cleanText = text.slice(9);
        } else if (lowerText.startsWith('@waiting ')) {
            status = 'waiting';
            cleanText = text.slice(9);
        } else if (lowerText.startsWith('@someday ')) {
            status = 'someday';
            cleanText = text.slice(9);
        } else if (lowerText.startsWith('@read ')) {
            status = 'reference';
            cleanText = text.slice(6);
        }

        if (isProject) {
            const newProject: Project = {
                id: Date.now(),
                name: cleanText,
                status: 'active',
                items: []
            };
            setProjects([newProject, ...projects]);
        } else {
            const newItem: GTDItem = {
                id: Date.now(),
                text: cleanText,
                status,
                createdAt: Date.now()
            };
            setItems([newItem, ...items]);
        }
    };

    const handleProcessItem = (id: number, updates: Partial<GTDItem>) => {
        setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));

        // Auto-advance logic for Clarify mode
        if (id === clarifyingId) {
            const currentInbox = items.filter(i => i.status === 'inbox' && i.id !== id);
            // Logic to find next item
            const nextIndex = inboxItems.findIndex(i => i.id === id) + 1;
            // This logic is slightly tricky because 'items' state is not yet updated in this closure
            // Effectively we just clear for now, or the child component handles "next"
            setClarifyingId(null);
        }
    };

    const handleCreateProject = (name: string, initialTasks: string[] = []) => {
        const newProject: Project = {
            id: Date.now(),
            name,
            status: 'active',
            items: []
        };

        const newTasks = initialTasks.map((t, idx) => ({
            id: Date.now() + idx + 1,
            text: t,
            status: 'actionable' as const,
            projectId: newProject.id,
            createdAt: Date.now()
        }));

        setProjects([...projects, newProject]);
        setItems([...items, ...newTasks]);
    };

    const handleDelete = (id: number) => {
        setItems(items.filter(i => i.id !== id));
    };

    const handleQuickAdd = (item: Partial<GTDItem>) => {
        const newItem: GTDItem = {
            id: Date.now(),
            text: item.text || '',
            status: item.status || 'inbox',
            createdAt: Date.now(),
            projectId: item.projectId,
            delegatedTo: item.delegatedTo,
            dueDate: item.dueDate
        };
        setItems([newItem, ...items]);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'capture':
                return <GTDCapture
                    items={items}
                    projects={projects}
                    onCapture={handleCapture}
                    onSelect={(id) => { setClarifyingId(id); setActiveTab('clarify'); }}
                    onDelete={handleDelete}
                />;
            case 'clarify':
                return <GTDClarify
                    item={items.find(i => i.id === clarifyingId) || inboxItems[0]}
                    onProcess={handleProcessItem}
                    onCreateProject={handleCreateProject}
                    onNavigate={(tab) => setActiveTab(tab)}
                    projects={projects}
                    hasMore={inboxItems.length > 0}
                />;
            case 'organize':
                return <GTDOrganize
                    projects={projects}
                    items={items}
                    onUpdateItem={handleProcessItem}
                    onAddProject={handleCreateProject}
                    onAddItem={handleQuickAdd}
                />;
            case 'review':
                return <GTDReview items={items} />;
            case 'engage':
                return <GTDEngage actions={nextActions} projects={projects} />;
            default:
                return null;
        }
    };

    const tabs = [
        { id: 'capture', label: 'Capture', icon: Inbox, color: 'text-blue-600', count: inboxItems.length },
        { id: 'clarify', label: 'Clarify', icon: CheckCircle2, color: 'text-amber-600', count: clarifyingId ? 1 : 0 },
        { id: 'organize', label: 'Organize', icon: Layers, color: 'text-indigo-600', count: 0 },
        { id: 'review', label: 'Reflect', icon: CheckSquare, color: 'text-emerald-600', count: 0 },
        { id: 'engage', label: 'Engage', icon: Zap, color: 'text-orange-600', count: 0 }
    ] as const;

    return (
        <div className="h-full w-full bg-stone-50 rounded-[2.5rem] p-6 shadow-inner ring-1 ring-stone-900/5 flex flex-col font-serif relative overflow-hidden">
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>

            {/* Header Section - Clean & Functional */}
            <div className="flex-none pt-10 pb-6 z-10 relative bg-white/60 border-b border-stone-200/50 backdrop-blur-xl px-8">

                <div className="flex items-end justify-between max-w-7xl mx-auto mb-8">
                    {/* Left: Greeting & Context */}
                    <div>
                        <h2 className="text-4xl md:text-5xl font-serif italic text-stone-900 tracking-tight leading-none mb-2">
                            {(() => {
                                const hour = new Date().getHours();
                                if (hour < 12) return 'Good morning';
                                if (hour < 17) return 'Good afternoon';
                                return 'Good evening';
                            })()}, {userName.split(' ')[0]}
                        </h2>
                        <p className="text-xs font-bold font-sans text-stone-400 uppercase tracking-widest pl-1">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-6 pb-1">
                        <button onClick={onOpenDiscussion} className="text-xs font-bold text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-wider font-sans group flex items-center gap-2">
                            <span>Discussion</span>
                        </button>
                        <div className="w-px h-3 bg-stone-200"></div>
                        <button className="text-xs font-bold text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-wider font-sans">
                            New Goal
                        </button>
                        <div className="w-px h-3 bg-stone-200"></div>
                        <button className="text-xs font-bold text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-wider font-sans">
                            Reminder
                        </button>
                        <button onClick={onOpenQuickTask} className="ml-4 bg-stone-900 text-white px-5 py-2 rounded-xl shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all text-xs font-bold tracking-widest uppercase flex items-center gap-2">
                            <Plus size={14} strokeWidth={3} />
                            <span>Task</span>
                        </button>
                    </div>
                </div>

                {/* System Title - Enhanced Placement */}
                <div className="text-center mb-10 mt-32">
                    <h1 className="text-3xl font-serif italic text-stone-900 tracking-tight">
                        The Getting Things Done System
                    </h1>
                </div>

                {/* Navigation Tabs - Centered & Clean */}
                <div className="flex justify-center relative z-20">
                    <div className="flex items-center bg-stone-100/50 p-1 rounded-2xl border border-stone-200/50 backdrop-blur-sm">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                            relative px-8 py-2.5 rounded-xl flex items-center gap-2.5 transition-all duration-300
                                            ${isActive
                                            ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5'
                                            : 'text-stone-400 hover:text-stone-600 hover:bg-stone-200/50'
                                        }
                                        `}
                                >
                                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? tab.color : 'text-stone-400'} />
                                    <span className={`text-[11px] font-bold tracking-widest uppercase ${isActive ? 'opacity-100' : 'opacity-100'}`}>
                                        {tab.label}
                                    </span>
                                    {tab.count > 0 && (
                                        <span className={`flex h-4 min-w-[1rem] px-1 items-center justify-center rounded-full text-[9px] font-extrabold ${isActive ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'}`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden bg-white/30 relative">
                <div className="flex-1 overflow-hidden w-full relative z-10">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
