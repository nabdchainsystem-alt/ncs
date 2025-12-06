import React, { useState } from 'react';
import { CheckCircle2, Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MoreHorizontal } from 'lucide-react';
import { GTDItem, Project } from '../GTDSystemWidget';

interface GTDOrganizeProps {
    projects: Project[];
    items: GTDItem[];
    onUpdateItem: (id: number, updates: Partial<GTDItem>) => void;
}

export const GTDOrganize = ({ projects, items, onUpdateItem }: GTDOrganizeProps) => {
    // Filter items based on the user's "Clarify" choices
    // Tasks: Actionable items without a specific due date (Next Actions)
    const tasks = items.filter(i => i.status === 'actionable' && !i.dueDate);

    // Reminders: Actionable items WITH a due date
    const reminders = items.filter(i => (i.status === 'actionable' || i.status === 'waiting') && i.dueDate).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());

    // Helper to render calendar grid
    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startingDay = firstDay.getDay(); // 0 = Sun
        const totalDays = lastDay.getDate();

        const days = [];
        // Padding for previous month
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`pad-${i}`} className="h-10"></div>);
        }

        // Days of current month
        for (let i = 1; i <= totalDays; i++) {
            const dateTimestamp = new Date(year, month, i).setHours(0, 0, 0, 0);
            const hasReminder = reminders.some(r => {
                const rDate = new Date(r.dueDate!).setHours(0, 0, 0, 0);
                return rDate === dateTimestamp;
            });
            const isToday = new Date().setHours(0, 0, 0, 0) === dateTimestamp;

            days.push(
                <div key={i} className={`h-10 flex items-center justify-center relative rounded-lg text-sm font-serif group cursor-pointer hover:bg-stone-100 transition-colors ${isToday ? 'font-bold bg-stone-100 text-stone-900 border border-stone-200' : 'text-stone-600'}`}>
                    {i}
                    {hasReminder && (
                        <div className="absolute bottom-1.5 w-1 h-1 bg-amber-500 rounded-full"></div>
                    )}
                </div>
            );
        }

        return (
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1))} className="p-1 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-900"><ChevronLeft size={16} /></button>
                    <span className="font-serif font-bold text-stone-800">{currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1))} className="p-1 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-900"><ChevronRight size={16} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-[10px] font-bold text-stone-400 uppercase">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {days}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col font-serif">
            {/* Header */}
            <div className="flex-none text-center mb-6">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1 block font-sans">Step 3</span>
                <h3 className="text-3xl font-serif text-stone-900 mb-1 tracking-tight italic">Organize</h3>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-6 overflow-hidden pr-2">

                {/* Column 1: Tasks (Actionable, No Date) */}
                <div className="flex flex-col bg-stone-50/50 rounded-2xl border border-stone-100 p-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400/50 to-emerald-400/0"></div>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-stone-900 font-sans">
                            <CheckCircle2 size={14} className="text-emerald-600" /> Tasks
                        </h4>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{tasks.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                        {tasks.map(item => (
                            <div key={item.id} className="group p-3 bg-white border border-stone-100 rounded-xl hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer flex items-start gap-3">
                                <div className="mt-1 w-4 h-4 rounded-full border-2 border-stone-200 group-hover:border-emerald-500 transition-colors"></div>
                                <div className="flex-1">
                                    <span className="font-serif text-stone-800 text-sm leading-snug block">{item.text}</span>
                                    {item.projectId && <span className="text-[10px] text-stone-400 font-sans uppercase tracking-wider">Project #{item.projectId}</span>}
                                </div>
                            </div>
                        ))}
                        {tasks.length === 0 && (
                            <div className="h-32 flex flex-col items-center justify-center text-stone-300 border-2 border-dashed border-stone-200 rounded-xl">
                                <span className="text-sm italic">No next actions</span>
                            </div>
                        )}
                        <button className="w-full py-3 border border-dashed border-emerald-200 text-emerald-600 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-50 transition-colors mt-2">
                            + Add Task
                        </button>
                    </div>
                </div>

                {/* Column 2: Reminders (Actionable, With Date) */}
                <div className="flex flex-col bg-stone-50/50 rounded-2xl border border-stone-100 p-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400/50 to-amber-400/0"></div>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-stone-900 font-sans">
                            <Bell size={14} className="text-amber-600" /> Reminders
                        </h4>
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{reminders.length}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                        {reminders.map(item => (
                            <div key={item.id} className="group p-3 bg-white border border-stone-100 rounded-xl hover:border-amber-200 hover:shadow-md transition-all cursor-pointer">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-serif font-bold text-stone-800 text-sm line-clamp-1">{item.text}</span>
                                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                                        {new Date(item.dueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-stone-400">
                                    <Clock size={12} />
                                    <span className="text-[10px] font-sans uppercase tracking-wider">{item.time || 'All Day'}</span>
                                </div>
                            </div>
                        ))}
                        {reminders.length === 0 && (
                            <div className="h-32 flex flex-col items-center justify-center text-stone-300 border-2 border-dashed border-stone-200 rounded-xl">
                                <span className="text-sm italic">No reminders</span>
                            </div>
                        )}
                        <button className="w-full py-3 border border-dashed border-amber-200 text-amber-600 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-amber-50 transition-colors mt-2">
                            + Add Reminder
                        </button>
                    </div>
                </div>

                {/* Column 3: Calendar */}
                <div className="flex flex-col bg-stone-50/50 rounded-2xl border border-stone-100 p-4 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400/50 to-indigo-400/0"></div>
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-stone-900 font-sans">
                            <CalendarIcon size={14} className="text-indigo-600" /> Calendar
                        </h4>
                        <button className="text-stone-400 hover:text-stone-900"><MoreHorizontal size={16} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 scrollbar-hide">
                        {renderCalendar()}

                        <div className="mt-4 space-y-2">
                            <h5 className="font-sans font-bold text-[10px] uppercase text-stone-400 tracking-wider pl-1">Today's Agenda</h5>
                            {/* Filter for actual today's items */}
                            {reminders.filter(r => new Date(r.dueDate!).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)).length > 0 ? (
                                reminders.filter(r => new Date(r.dueDate!).setHours(0, 0, 0, 0) === new Date().setHours(0, 0, 0, 0)).map(r => (
                                    <div key={r.id} className="flex items-center gap-3 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                        <div className="text-xs font-bold text-indigo-600 w-12 text-center">{r.time || 'All Day'}</div>
                                        <div className="h-4 w-[1px] bg-indigo-200"></div>
                                        <div className="text-sm font-serif text-stone-700 truncate">{r.text}</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-stone-400 italic pl-1">Nothing scheduled for today.</p>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
