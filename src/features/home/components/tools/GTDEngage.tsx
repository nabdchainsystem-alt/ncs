import React, { useState } from 'react';
import { CheckCircle2, Zap, Clock, Calendar, ChevronDown, Filter } from 'lucide-react';
import { GTDItem, Project } from '../GTDSystemWidget';

interface GTDEngageProps {
    actions: GTDItem[];
    projects: Project[];
}

export const GTDEngage = ({ actions, projects }: GTDEngageProps) => {
    const [filter, setFilter] = useState('all');

    // Get unique contexts from actions
    const contexts = Array.from(new Set(actions.map(a => a.contextId || 'uncategorized')));

    const filteredActions = filter === 'all'
        ? actions
        : actions.filter(a => (a.contextId || 'uncategorized') === filter);

    return (
        <div className="h-full flex flex-col font-serif p-6 max-w-[90rem] mx-auto w-full">
            {/* Header */}
            <div className="flex-none text-center mb-6">
                <h1 className="text-4xl md:text-5xl font-bold font-serif text-stone-900 uppercase tracking-widest select-none">
                    Engage
                </h1>
            </div>

            {/* Filter Chips */}
            <div className="flex-none mb-6 px-4">
                <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all font-sans border ${filter === 'all'
                            ? 'bg-stone-800 text-white border-stone-800'
                            : 'bg-white text-stone-400 border-stone-200 hover:border-stone-400 hover:text-stone-600'
                            }`}
                    >
                        All
                    </button>
                    {contexts.map(ctx => (
                        <button
                            key={ctx}
                            onClick={() => setFilter(ctx)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all font-sans border ${filter === ctx
                                ? 'bg-stone-800 text-white border-stone-800'
                                : 'bg-white text-stone-400 border-stone-200 hover:border-stone-400 hover:text-stone-600'
                                }`}
                        >
                            {ctx}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions List - Strictly Limited Scrolling */}
            <div className="flex-1 relative w-full min-h-0">
                <div className="absolute inset-0 overflow-y-auto scrollbar-hide px-4 pb-12">
                    <div className="max-w-2xl mx-auto space-y-3">
                        {filteredActions.length === 0 ? (
                            <div className="text-center py-12 text-stone-300">
                                <span className="block text-4xl mb-4">☕️</span>
                                <p className="italic font-serif text-lg">Nothing to do here.</p>
                                <p className="text-sm font-sans">Check other contexts or enjoy your break.</p>
                            </div>
                        ) : (
                            filteredActions.map((action) => {
                                const project = projects.find(p => p.id === action.projectId);
                                return (
                                    <div key={action.id} className="group bg-white p-4 rounded-xl border border-stone-200 hover:border-stone-400 shadow-sm hover:shadow-md transition-all cursor-pointer">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <button className="pt-1 text-stone-300 hover:text-green-600 transition-colors">
                                                    <CheckCircle2 size={24} strokeWidth={1.5} />
                                                </button>
                                                <div>
                                                    <h4 className="text-xl font-serif italic text-stone-800 mb-1 group-hover:text-black transition-colors">{action.text}</h4>
                                                    <div className="flex items-center gap-3 text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest">
                                                        {project && <span className="text-stone-500">📂 {project.name}</span>}
                                                        {action.contextId && <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">{action.contextId}</span>}
                                                        {action.time && <span className="flex items-center gap-1"><Clock size={10} /> {action.time}</span>}
                                                        {action.energy && <span className="flex items-center gap-1"><Zap size={10} /> {action.energy}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            {action.dueDate && (
                                                <span className="text-xs font-serif italic text-red-500 bg-red-50 px-2 py-1 rounded-md">
                                                    Due {new Date(action.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }))}
                    </div>
                </div>
                {/* Fade Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-stone-50/100 to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
};
