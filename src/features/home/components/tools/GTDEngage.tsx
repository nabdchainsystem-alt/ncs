import React, { useState } from 'react';
import { CheckCircle2, Zap, Clock, Calendar, ChevronDown, Filter, Layers, Target, Bell, Hash, MessageSquare } from 'lucide-react';
import { GTDItem, Project } from '../GTDSystemWidget';

interface GTDEngageProps {
    actions: GTDItem[];
    projects: Project[];
    onExport: (item: GTDItem, type: 'task' | 'goal' | 'reminder' | 'discussion') => void;
}

export const GTDEngage = ({ actions, projects, onExport }: GTDEngageProps) => {
    const [filter, setFilter] = useState('all');

    // Get unique contexts from actions
    const contexts = Array.from(new Set(actions.map(a => a.contextId || 'uncategorized')));

    const filteredActions = filter === 'all'
        ? actions
        : actions.filter(a => (a.contextId || 'uncategorized') === filter);

    return (
        <div className="h-full min-h-[600px] flex flex-col font-serif p-6 max-w-[90rem] mx-auto w-full">
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
            <div className="flex-1 w-full min-h-0">
                <div className="max-h-[500px] overflow-y-auto scrollbar-hide px-4 pb-12">
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
                                    <div key={action.id} className="group bg-white p-4 rounded-xl border border-stone-200 hover:border-stone-400 shadow-sm hover:shadow-md transition-all cursor-default">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3 flex-1">
                                                <button className="pt-1 text-stone-300 hover:text-green-600 transition-colors">
                                                    <CheckCircle2 size={24} strokeWidth={1.5} />
                                                </button>
                                                <div className="flex-1">
                                                    <h4 className="text-xl font-serif italic text-stone-800 mb-2 group-hover:text-black transition-colors leading-tight">{action.text}</h4>

                                                    {/* Meta Row */}
                                                    <div className="flex items-center gap-3 text-[10px] font-sans font-bold text-stone-400 uppercase tracking-widest mb-3">
                                                        {project && <span className="text-stone-500 flex items-center gap-1"><Layers size={10} /> {project.name}</span>}
                                                        {action.contextId && <span className="bg-stone-100 px-1.5 py-0.5 rounded text-stone-500">#{action.contextId}</span>}
                                                        {action.time && <span className="flex items-center gap-1"><Clock size={10} /> {action.time}</span>}
                                                        {action.energy && <span className="flex items-center gap-1"><Zap size={10} /> {action.energy}</span>}
                                                    </div>

                                                    {/* Action Buttons Row */}
                                                    <div className="flex items-center gap-2 pt-2 border-t border-stone-100 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => onExport(action, 'task')}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-400 hover:text-blue-600 transition-all text-xs font-bold uppercase tracking-wider border border-transparent hover:border-stone-200"
                                                            title="Send to Task Board"
                                                        >
                                                            <Layers size={14} />
                                                            <span>Task</span>
                                                        </button>
                                                        <button
                                                            onClick={() => onExport(action, 'goal')}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-400 hover:text-red-500 transition-all text-xs font-bold uppercase tracking-wider border border-transparent hover:border-stone-200"
                                                            title="Create Goal"
                                                        >
                                                            <Target size={14} />
                                                            <span>Goal</span>
                                                        </button>
                                                        <button
                                                            onClick={() => onExport(action, 'reminder')}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-400 hover:text-amber-500 transition-all text-xs font-bold uppercase tracking-wider border border-transparent hover:border-stone-200"
                                                            title="Set Reminder"
                                                        >
                                                            <Bell size={14} />
                                                            <span>Remind</span>
                                                        </button>
                                                        <button
                                                            onClick={() => onExport(action, 'discussion')}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-400 hover:text-purple-500 transition-all text-xs font-bold uppercase tracking-wider border border-transparent hover:border-stone-200"
                                                            title="Start Discussion"
                                                        >
                                                            <MessageSquare size={14} />
                                                            <span>Discuss</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {action.dueDate && (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-xs font-serif italic text-red-500 bg-red-50 px-2 py-1 rounded-md mb-1 whitespace-nowrap">
                                                        Due {new Date(action.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </span>
                                                </div>
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
