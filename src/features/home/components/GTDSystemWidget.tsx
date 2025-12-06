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

        // Create tasks for the project
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

    const renderContent = () => {
        switch (activeTab) {
            case 'capture':
                return <GTDCapture
                    items={items}
                    projects={projects}
                    onCapture={handleCapture}
                    onSelect={(id) => { setClarifyingId(id); setActiveTab('clarify'); }}
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

            {/* Header Section */}
            <div className="flex-none pt-8 pb-4 z-10 relative bg-white/40 border-b border-stone-100/50 backdrop-blur-md">

                {/* Top Action Bar - Absolute Right */}
                <div className="absolute top-6 right-8 flex items-center gap-3">
                    <button onClick={onOpenDiscussion} className="p-2 text-stone-400 hover:text-stone-900 transition-colors" title="Discussion">
                        <span className="sr-only">Discussion</span>
                        {/* Assuming icons are imported, if not just text or generic icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </button>
                    <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors" title="New Goal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                    </button>
                    <button className="p-2 text-stone-400 hover:text-stone-900 transition-colors" title="New Reminder">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
                    </button>
                    <button onClick={onOpenQuickTask} className="bg-stone-900 text-stone-50 px-5 py-2 rounded-full shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all text-xs font-bold tracking-wide flex items-center gap-2">
                        <span>+</span> New Task
                    </button>
                </div>

                <div className="text-center px-6">
                    <h1 className="text-5xl font-serif text-stone-900 mb-2 tracking-tighter italic">
                        Getting Things Done System
                    </h1>
                    <p className="text-stone-400 font-sans tracking-widest uppercase text-[10px] font-bold opacity-60 mb-6">
                        Capture • Clarify • Organize • Reflect • Engage
                    </p>
                </div>

                {/* Navigation Tabs - Centered */}
                <div className="flex justify-center mb-2">
                    <div className="flex items-center gap-1 bg-stone-100/50 p-1.5 rounded-full border border-stone-200/50 backdrop-blur-sm">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`
                                            relative px-6 py-2.5 rounded-full flex items-center gap-2 transition-all duration-300
                                            ${isActive
                                            ? 'bg-white shadow-sm text-stone-900 translate-y-0'
                                            : 'text-stone-500 hover:text-stone-700 hover:bg-stone-200/50'
                                        }
                                        `}
                                >
                                    <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? tab.color : 'text-stone-400'} />
                                    <span className={`text-xs font-bold tracking-wider uppercase ${isActive ? 'opacity-100' : 'opacity-100'}`}>
                                        {tab.label}
                                    </span>
                                    {tab.count > 0 && (
                                        <span className={`ml-1.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-stone-100 text-stone-900' : 'bg-stone-200 text-stone-500'}`}>
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
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200">
                    <div className="h-full w-full">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};
