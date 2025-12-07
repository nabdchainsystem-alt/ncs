import React, { useState } from 'react';
import { ListChecks, Inbox, CheckCircle2, Layers, Clock, Bell, RefreshCw, CalendarDays, Filter, Briefcase } from 'lucide-react';
import { GTDItem, Project } from '../GTDSystemWidget';

interface GTDReviewProps {
    items: GTDItem[];
    projects: Project[];
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

export const GTDReview = ({ items, projects }: GTDReviewProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>('daily');

    // --- Time Logic ---
    const getPeriodStart = (mode: ViewMode): number => {
        const now = new Date();
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        if (mode === 'weekly') {
            const day = start.getDay() || 7; // Get current day number, make Sunday 7
            if (day !== 1) start.setHours(-24 * (day - 1)); // Go back to Monday
        } else if (mode === 'monthly') {
            start.setDate(1); // First day of month
        }
        return start.getTime();
    };

    const periodStart = getPeriodStart(viewMode);

    // --- Filtering ---
    // Common helper to check if item is "relevant" to the period (created or completed)
    const isNewInPeriod = (item: GTDItem | Project) => (item as any).createdAt ? (item as any).createdAt >= periodStart : (item.id >= periodStart); // Projects use ID as timestamp fallback if no createdAt? 
    // ID for project is Date.now(), so checking ID works for "created at" check.

    const isDoneInPeriod = (item: GTDItem) => item.status === 'done' && (item.completedAt ? item.completedAt >= periodStart : item.createdAt >= periodStart);

    // Lists
    // For backlog lists (Inbox, Actions, Waiting), we show CURRENT items (Total) AND "New this period" count.
    const inbox = items.filter(i => i.status === 'inbox');
    const nextActions = items.filter(i => i.status === 'actionable');
    const waiting = items.filter(i => i.status === 'waiting');
    const someday = items.filter(i => i.status === 'someday');
    const activeProjects = projects.filter(p => p.status !== 'completed'); // Show active projects

    // For Completed, we ONLY show items completed in this period
    const completedInPeriod = items.filter(isDoneInPeriod).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

    // Stats for the "Counts" logic
    const getNewCount = (list: (GTDItem | Project)[]) => list.filter(item => {
        // Project ID is timestamp, GTDItem has createdAt
        const time = (item as any).createdAt || item.id;
        return time >= periodStart;
    }).length;

    const sections = [
        { id: 'inbox', title: 'Inbox', icon: Inbox, items: inbox, color: 'text-blue-500', statLabel: 'New', statCount: getNewCount(inbox) },
        { id: 'actions', title: 'Next Actions', icon: CheckCircle2, items: nextActions, color: 'text-emerald-500', statLabel: 'New', statCount: getNewCount(nextActions) },
        { id: 'waiting', title: 'Waiting For', icon: Bell, items: waiting, color: 'text-amber-500', statLabel: 'New', statCount: getNewCount(waiting) },
        // Row 2
        { id: 'projects', title: 'Active Projects', icon: Briefcase, items: activeProjects.map(p => ({ id: p.id, text: p.name, ...p })), color: 'text-indigo-500', statLabel: 'New', statCount: getNewCount(activeProjects) },
        { id: 'someday', title: 'Someday / Maybe', icon: Clock, items: someday, color: 'text-stone-400', statLabel: 'New', statCount: getNewCount(someday) },
        { id: 'done', title: `Completed (${viewMode})`, icon: ListChecks, items: completedInPeriod, color: 'text-stone-800', statLabel: 'Total', statCount: completedInPeriod.length },
    ];

    return (
        <div className="h-full min-h-[600px] flex flex-col font-serif p-6 max-w-[90rem] mx-auto w-full">
            {/* Header & Toggle - Centered */}
            <div className="flex flex-col items-center justify-center mb-8 pb-6 border-b border-stone-100">
                <div className="text-center mb-6">
                    <h1 className="text-4xl md:text-5xl font-bold font-serif text-stone-900 uppercase tracking-widest select-none">
                        Reflect
                    </h1>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-2">
                        {viewMode === 'daily' ? 'Today\'s Progress' : viewMode === 'weekly' ? 'Weekly Reset' : 'Monthly Overview'}
                    </p>
                </div>

                {/* Toggle */}
                <div className="flex bg-stone-100 p-1 rounded-xl">
                    {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === mode
                                ? 'bg-white text-stone-900 shadow-sm'
                                : 'text-stone-400 hover:text-stone-600'
                                }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Layout (No Cards) - Grid for compactness */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8 pb-12">
                    {sections.map(section => (
                        <div key={section.id} className="group">
                            {/* Section Header */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <section.icon size={20} className={`${section.color} opacity-80`} />
                                    <h3 className="text-xl font-serif font-bold text-stone-800">{section.title}</h3>
                                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50 px-2 py-1 rounded-full border border-stone-100">
                                        <span>Total: {section.items.length}</span>
                                        {section.id !== 'done' && section.statCount > 0 && (
                                            <>
                                                <span className="text-stone-300">|</span>
                                                <span className={section.color}>{section.statLabel}: {section.statCount}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section Items */}
                            <div className="space-y-1 pl-2 md:pl-8 border-l border-stone-100 group-hover:border-stone-200 transition-colors max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-stone-200 scrollbar-track-transparent">
                                {section.items.length > 0 ? (
                                    section.items.slice(0, 100).map(item => (
                                        <div key={item.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-stone-50 transition-colors flex-shrink-0">
                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${section.id === 'done' ? 'bg-stone-300' : 'bg-indigo-300'}`}></div>
                                            <span className={`text-sm font-serif truncate ${section.id === 'done' ? 'text-stone-400 line-through decoration-stone-200' : 'text-stone-700'}`}>
                                                {item.text}
                                            </span>
                                            {/* Timestamp (Optional display) */}
                                            {section.id === 'done' && (
                                                <span className="ml-auto text-[10px] text-stone-300 font-sans uppercase tracking-wider">
                                                    {(item.completedAt || item.createdAt) ? new Date(item.completedAt || item.createdAt).toLocaleDateString(undefined, { weekday: 'short' }) : ''}
                                                </span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-2 px-3 text-stone-300 text-sm italic">
                                        No items {section.id === 'done' ? 'completed in this period' : 'in this list'}.
                                    </div>
                                )}
                                {section.items.length > 100 && (
                                    <div className="py-2 px-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                        + {section.items.length - 100} more...
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
