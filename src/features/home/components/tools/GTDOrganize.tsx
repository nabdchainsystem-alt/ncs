import React, { useState } from 'react';
import { CheckCircle2, Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MoreHorizontal, Layers, Archive, User } from 'lucide-react';
import { GTDItem, Project } from '../GTDSystemWidget';

interface GTDOrganizeProps {
    projects: Project[];
    items: GTDItem[];
    onUpdateItem: (id: number, updates: Partial<GTDItem>) => void;
}

export const GTDOrganize = ({ projects, items, onUpdateItem }: GTDOrganizeProps) => {
    // Filter items
    const tasks = items.filter(i => i.status === 'actionable' && !i.dueDate);
    const scheduled = items.filter(i => (i.status === 'actionable' || i.status === 'waiting') && i.dueDate).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
    const waiting = items.filter(i => i.status === 'waiting');
    const someday = items.filter(i => i.status === 'someday');

    const Column = ({ title, icon: Icon, count, children, color = "stone" }: any) => {
        const borderColors: any = {
            stone: 'border-stone-100/50',
            emerald: 'border-emerald-100/50',
            indigo: 'border-indigo-100/50',
            amber: 'border-amber-100/50',
            blue: 'border-blue-100/50',
        };
        const bgColors: any = {
            stone: 'bg-white/40',
            emerald: 'bg-emerald-50/30',
            indigo: 'bg-indigo-50/30',
            amber: 'bg-amber-50/30',
            blue: 'bg-blue-50/30',
        };

        return (
            <div className={`flex flex-col ${bgColors[color]} rounded-3xl border ${borderColors[color]} backdrop-blur-sm h-full overflow-hidden transition-all hover:shadow-lg`}>
                <div className="p-6 pb-2 flex-none flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${color === 'stone' ? 'bg-white' : 'bg-white/60'} shadow-sm`}>
                            <Icon size={18} className={`text-${color}-600`} />
                        </div>
                        <h3 className="font-serif font-bold text-lg text-stone-800 italic">{title}</h3>
                    </div>
                    <span className="bg-white/50 px-2 py-1 rounded-lg text-xs font-bold text-stone-500">{count}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                    {children}
                </div>
            </div>
        );
    };

    const ListItem = ({ item, type = "task" }: { item: any, type?: "task" | "project" | "waiting" }) => (
        <div className="group bg-white/60 hover:bg-white p-4 rounded-xl border border-stone-100 hover:border-stone-300 transition-all cursor-pointer shadow-sm hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                    <p className="font-serif text-stone-800 text-sm leading-snug font-medium mb-1 line-clamp-2">
                        {type === 'project' ? item.name : item.text}
                    </p>
                    {type === 'waiting' && item.delegatedTo && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-1 rounded-md w-fit">
                            <User size={10} /> Waiting: {item.delegatedTo}
                        </div>
                    )}
                    {item.dueDate && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit">
                            <CalendarIcon size={10} /> {new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </div>
                {type === 'project' ? (
                    <div className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5"></div>
                ) : (
                    <div className={`h-4 w-4 rounded-full border-2 mt-0.5 transition-colors ${type === 'task' ? 'border-emerald-200 group-hover:border-emerald-500' :
                            type === 'waiting' ? 'border-amber-200 group-hover:border-amber-500' : 'border-stone-200'
                        }`}></div>
                )}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col font-serif p-0">
            {/* Header removed as simpler is better, or we can add a small "Organize" subheader if needed, but the main Title is outside */}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
                {/* 1. Projects */}
                <Column title="Projects" icon={Layers} count={projects.filter(p => p.status === 'active').length} color="indigo">
                    {projects.filter(p => p.status === 'active').map(p => (
                        <ListItem key={p.id} item={p} type="project" />
                    ))}
                    <button className="w-full py-3 border-2 border-dashed border-indigo-200/50 rounded-xl text-indigo-400 text-xs font-bold uppercase tracking-wider hover:bg-indigo-50 hover:border-indigo-300 transition-colors">
                        + New Project
                    </button>
                </Column>

                {/* 2. Next Actions */}
                <Column title="Next Actions" icon={CheckCircle2} count={tasks.length} color="emerald">
                    {tasks.map(t => (
                        <ListItem key={t.id} item={t} type="task" />
                    ))}
                    <button className="w-full py-3 border-2 border-dashed border-emerald-200/50 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-wider hover:bg-emerald-50 hover:border-emerald-300 transition-colors">
                        + Next Action
                    </button>
                </Column>

                {/* 3. Waiting For */}
                <Column title="Waiting For" icon={Clock} count={waiting.length} color="amber">
                    {waiting.map(w => (
                        <ListItem key={w.id} item={w} type="waiting" />
                    ))}
                    <button className="w-full py-3 border-2 border-dashed border-amber-200/50 rounded-xl text-amber-400 text-xs font-bold uppercase tracking-wider hover:bg-amber-50 hover:border-amber-300 transition-colors">
                        + Log Waiting
                    </button>
                </Column>

                {/* 4. Scheduled / Someday */}
                <Column title="Scheduled" icon={CalendarIcon} count={scheduled.length} color="stone">
                    {scheduled.map(s => (
                        <ListItem key={s.id} item={s} type="task" />
                    ))}
                    <div className="my-4 pt-4 border-t border-stone-200/50">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Someday / Maybe</span>
                            <Archive size={14} className="text-stone-300" />
                        </div>
                        {someday.map(s => (
                            <div key={s.id} className="group p-3 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer flex items-center gap-2 text-stone-600 hover:text-stone-900">
                                <div className="h-1.5 w-1.5 rounded-full bg-stone-300"></div>
                                <span className="text-sm font-serif truncate">{s.text}</span>
                            </div>
                        ))}
                    </div>
                </Column>
            </div>
        </div>
    );
};
