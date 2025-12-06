import React, { useState } from 'react';
import { Inbox, CheckCircle2, FolderInput, ListChecks, PlayCircle, Calendar, Hash, ArrowRight, Trash2, Archive, Clock, Play } from 'lucide-react';
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
        const newItem: GTDItem = {
            id: Date.now(),
            text,
            status: 'inbox',
            createdAt: Date.now()
        };
        setItems([newItem, ...items]);
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
                    inbox={inboxItems}
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
        { id: 'organize', label: 'Organize', icon: FolderInput, color: 'text-indigo-600' },
        { id: 'review', label: 'Reflect', icon: ListChecks, color: 'text-green-600' },
        { id: 'engage', label: 'Engage', icon: Play, color: 'text-rose-600' },
    ] as const;

    return (
        <div className="h-full w-full bg-stone-50 rounded-[2.5rem] p-6 shadow-inner ring-1 ring-stone-900/5 flex flex-col font-serif relative overflow-hidden">
            {/* Paper Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>

            {/* Main Content Area (Unified Block) */}
            <div className="flex-1 relative z-10 overflow-hidden bg-white/60 backdrop-blur-sm rounded-3xl border border-stone-100 shadow-sm flex flex-col">

                {/* Greeting & Actions Section */}
                <div className="flex-none flex flex-col items-center justify-center pt-8 pb-4 z-10 relative border-b border-stone-100/50 bg-white/40">
                    <div className="text-center mb-6">
                        <h1 className="text-5xl font-serif text-stone-900 mb-3 tracking-tight italic">
                            {(() => {
                                const hour = new Date().getHours();
                                if (hour < 12) return 'Good morning';
                                if (hour < 17) return 'Good afternoon';
                                return 'Good evening';
                            })()}, {userName}
                        </h1>
                        <p className="text-stone-500 font-sans tracking-wide uppercase text-xs font-bold">
                            What would you like to focus on today?
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap justify-center mb-6">
                        <button
                            onClick={onOpenQuickTask}
                            className="group relative px-6 py-3 bg-stone-900 text-stone-50 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                        >
                            <span className="relative z-10 flex items-center gap-2 font-bold text-sm tracking-wide">
                                <span className="text-stone-400 group-hover:text-white transition-colors">+</span> New Task
                            </span>
                        </button>

                        <button
                            onClick={onOpenDiscussion}
                            className="group relative px-6 py-3 bg-white text-stone-900 border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-stone-300 hover:-translate-y-0.5"
                        >
                            <span className="relative z-10 flex items-center gap-2 font-bold text-sm tracking-wide">
                                Discussion
                            </span>
                        </button>

                        <button
                            className="group relative px-6 py-3 bg-white text-stone-900 border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-stone-300 hover:-translate-y-0.5"
                        >
                            <span className="relative z-10 flex items-center gap-2 font-bold text-sm tracking-wide">
                                New Goal
                            </span>
                        </button>

                        <button
                            className="group relative px-6 py-3 bg-white text-stone-900 border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-stone-300 hover:-translate-y-0.5"
                        >
                            <span className="relative z-10 flex items-center gap-2 font-bold text-sm tracking-wide">
                                New Reminder
                            </span>
                        </button>

                        <button
                            className="group relative px-6 py-3 bg-white text-stone-900 border border-stone-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-stone-300 hover:-translate-y-0.5"
                        >
                            <span className="relative z-10 flex items-center gap-2 font-bold text-sm tracking-wide">
                                Add File
                            </span>
                        </button>
                    </div>
                </div>

                {/* Content Area with Right Sidebar */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 p-6">
                        {renderContent()}
                    </div>

                    {/* Right Sidebar Navigation */}
                    <div className="w-16 flex flex-col items-center py-6 gap-4 border-l border-stone-100 bg-stone-50/50">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group relative p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${activeTab === tab.id
                                    ? 'bg-stone-900 text-white shadow-md'
                                    : 'hover:bg-white hover:shadow-sm text-stone-400 hover:text-stone-800'
                                    }`}
                            >
                                <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />

                                {/* Label Tooltip - Expands to Left */}
                                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 overflow-hidden pointer-events-none">
                                    <div className="bg-stone-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-xl">
                                        {tab.label}
                                    </div>
                                </div>

                                {/* Badge */}
                                {(tab.id === 'capture' && tab.count > 0) && (
                                    <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${activeTab === tab.id ? 'bg-white text-black' : 'bg-red-500 text-white'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
