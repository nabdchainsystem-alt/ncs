import React, { useState } from 'react';
import { Inbox, CheckCircle2, FolderInput, ListChecks, PlayCircle } from 'lucide-react';
import { GTDCapture } from './tools/GTDCapture';
import { GTDClarify } from './tools/GTDClarify';
import { GTDOrganize } from './tools/GTDOrganize';
import { GTDReview } from './tools/GTDReview';
import { GTDEngage } from './tools/GTDEngage';

// Types
export interface GTDItem {
    id: number;
    text: string;
    status: 'inbox' | 'actionable' | 'reference' | 'trash' | 'someday' | 'done';
    projectId?: number;
    contextId?: string;
    energy?: 'High' | 'Medium' | 'Low';
    time?: '5m' | '15m' | '30m' | '1h+';
    createdAt: number;
}

export interface Project {
    id: number;
    name: string;
    status: 'active' | 'planning' | 'completed';
}

export interface Context {
    id: string;
    name: string;
    icon: any;
}

export const GTDSystemWidget = () => {
    const [activeTab, setActiveTab] = useState<'capture' | 'clarify' | 'organize' | 'review' | 'engage'>('capture');

    // -- Data State --
    const [items, setItems] = useState<GTDItem[]>([
        { id: 1, text: 'Call insurance company', status: 'inbox', createdAt: Date.now() },
        { id: 2, text: 'Brainstorm marketing ideas', status: 'inbox', createdAt: Date.now() - 1000 },
        { id: 3, text: 'Buy printer ink', status: 'actionable', contextId: 'errands', energy: 'Low', time: '30m', createdAt: Date.now() - 2000 },
    ]);

    const [projects, setProjects] = useState<Project[]>([
        { id: 101, name: 'Q4 Marketing Strategy', status: 'active' },
        { id: 102, name: 'Office Renovation', status: 'planning' },
    ]);

    const [clarifyingId, setClarifyingId] = useState<number | null>(null);

    // -- Derived State --
    const inboxItems = items.filter(i => i.status === 'inbox').sort((a, b) => b.createdAt - a.createdAt);
    const nextActions = items.filter(i => i.status === 'actionable');
    const referenceItems = items.filter(i => i.status === 'reference');

    // -- Handlers --
    const handleCapture = (text: string) => {
        const newItem: GTDItem = {
            id: Date.now(),
            text,
            status: 'inbox',
            createdAt: Date.now()
        };
        setItems([newItem, ...items]);
    };

    const handleSelectForClarify = (id: number) => {
        setClarifyingId(id);
        setActiveTab('clarify');
    };

    const handleProcessItem = (id: number, updates: Partial<GTDItem>) => {
        setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));
        // If processed out of inbox, clear selection or move to next
        if (id === clarifyingId) {
            const nextIndex = inboxItems.findIndex(i => i.id === id) + 1;
            if (nextIndex < inboxItems.length) {
                setClarifyingId(inboxItems[nextIndex].id);
            } else {
                setClarifyingId(null);
            }
        }
    };

    const tabs = [
        { id: 'capture', label: 'Capture', icon: Inbox },
        { id: 'clarify', label: 'Clarify', icon: CheckCircle2 },
        { id: 'organize', label: 'Organize', icon: FolderInput },
        { id: 'review', label: 'Review', icon: ListChecks },
        { id: 'engage', label: 'Engage', icon: PlayCircle },
    ] as const;

    const renderContent = () => {
        switch (activeTab) {
            case 'capture':
                return <GTDCapture
                    inbox={inboxItems}
                    onCapture={handleCapture}
                    onSelect={(item) => handleSelectForClarify(item.id)}
                />;
            case 'clarify':
                return <GTDClarify
                    item={items.find(i => i.id === clarifyingId) || inboxItems[0]}
                    onProcess={handleProcessItem}
                    projects={projects}
                />;
            case 'organize':
                return <GTDOrganize projects={projects} items={items} />;
            case 'review':
                return <GTDReview items={items} />;
            case 'engage':
                return <GTDEngage actions={nextActions} projects={projects} />;
            default:
                return null;
        }
    };

    return (
        <div className="h-full bg-white rounded-[2rem] shadow-sm border border-stone-100 flex flex-col overflow-hidden relative font-serif ring-1 ring-stone-50">
            {/* Unified Header */}
            <div className="flex-none px-10 py-6 flex items-center justify-between border-b border-stone-50 bg-white z-40 relative">
                <h2 className="text-2xl text-stone-900 font-serif italic tracking-tight font-medium">
                    Getting Things Done<span className="text-stone-300 mx-2">/</span>System
                </h2>

                <div className="flex items-center gap-2 bg-stone-50/50 p-1.5 rounded-full border border-stone-100">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                if (tab.id !== 'clarify') setClarifyingId(null);
                            }}
                            className="relative outline-none group"
                        >
                            <div className={`p-2.5 px-4 rounded-full transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                                    ? 'bg-white shadow-md text-stone-900 ring-1 ring-stone-900/5'
                                    : 'text-stone-400 hover:text-stone-600 hover:bg-stone-100/50'
                                }`}>
                                <tab.icon size={18} strokeWidth={activeTab === tab.id ? 2 : 1.5} />
                                {activeTab === tab.id && (
                                    <span className="text-xs font-bold uppercase tracking-widest animate-fade-in-right font-sans">
                                        {tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-0 overflow-hidden pt-24">
                {renderContent()}
            </div>
        </div>
    );
};
