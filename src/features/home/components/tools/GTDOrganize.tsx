import React, { useState } from 'react';
import { CheckCircle2, Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MoreHorizontal, Layers, Archive, User } from 'lucide-react';
import { GTDItem, Project } from '../GTDSystemWidget';

interface GTDOrganizeProps {
    projects: Project[];
    items: GTDItem[];
    onUpdateItem: (id: number, updates: Partial<GTDItem>) => void;
    onAddProject: (name: string) => void;
    onAddItem: (item: Partial<GTDItem>) => void;
}

export const GTDOrganize = ({ projects, items, onUpdateItem, onAddProject, onAddItem }: GTDOrganizeProps) => {
    // Filter items
    const tasks = items.filter(i => i.status === 'actionable' && !i.dueDate);
    const scheduled = items.filter(i => (i.status === 'actionable' || i.status === 'waiting') && i.dueDate).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
    const waiting = items.filter(i => i.status === 'waiting');
    const someday = items.filter(i => i.status === 'someday');

    // Modal State
    const [activeModal, setActiveModal] = useState<'project' | 'action' | 'waiting' | null>(null);
    const [newItemText, setNewItemText] = useState('');
    const [newItemWho, setNewItemWho] = useState('');
    const [newItemDate, setNewItemDate] = useState('');
    const [newItemEnergy, setNewItemEnergy] = useState<'High' | 'Medium' | 'Low' | null>(null);
    const [newItemContext, setNewItemContext] = useState(''); // e.g., @home
    const [newItemNotes, setNewItemNotes] = useState('');

    // Toggle for extended options
    const [currentStep, setCurrentStep] = useState(0);

    const handleSave = () => {
        if (!newItemText.trim()) return;

        const commonFields = {
            dueDate: newItemDate ? new Date(newItemDate).getTime() : undefined,
            energy: newItemEnergy || undefined,
            contextId: newItemContext || undefined,
            description: newItemNotes || undefined
        };

        if (activeModal === 'project') {
            onAddProject(newItemText);
        } else if (activeModal === 'action') {
            onAddItem({
                text: newItemText,
                status: 'actionable',
                ...commonFields
            });
        } else if (activeModal === 'waiting') {
            onAddItem({
                text: newItemText,
                status: 'waiting',
                delegatedTo: newItemWho || 'Someone',
                ...commonFields
            });
        }

        handleCloseModal();
    };

    const handleCloseModal = () => {
        setActiveModal(null);
        setNewItemText('');
        setNewItemWho('');
        setNewItemDate('');
        setNewItemEnergy(null);
        setNewItemContext('');
        setNewItemNotes('');
    };

    const Column = ({ title, description, icon: Icon, count, children, color = "stone" }: any) => {
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
                <div className="p-6 pb-4 flex-none">
                    <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${color === 'stone' ? 'bg-white' : 'bg-white/60'} shadow-sm`}>
                                <Icon size={18} className={`text-${color}-600`} />
                            </div>
                            <h3 className="font-serif font-bold text-lg text-stone-800 italic">{title}</h3>
                        </div>
                        <span className="bg-white/50 px-2 py-1 rounded-lg text-xs font-bold text-stone-500">{count}</span>
                    </div>
                    {description && (
                        <p className="text-xs text-stone-500 font-medium ml-11 leading-relaxed">{description}</p>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-3 scrollbar-hide">
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
                    {/* Render Due Date Tag */}
                    {item.dueDate && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit mt-1">
                            <CalendarIcon size={10} /> {new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                    {/* Render Context Tag */}
                    {item.contextId && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-1 rounded-md w-fit mt-1">
                            @ {item.contextId}
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
        <div className="h-full flex flex-col font-serif p-0 relative">

            <div className="w-full text-center py-6 pb-2">
                <h1 className="text-4xl md:text-5xl font-bold font-serif text-stone-900 uppercase tracking-widest select-none">
                    Organize
                </h1>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
                {/* 1. Projects */}
                <Column
                    title="Projects"
                    description="Outcomes requiring multiple steps"
                    icon={Layers}
                    count={projects.filter(p => p.status === 'active').length}
                    color="indigo"
                >
                    {projects.filter(p => p.status === 'active').map(p => (
                        <ListItem key={p.id} item={p} type="project" />
                    ))}
                    <button
                        onClick={() => setActiveModal('project')}
                        className="w-full py-3 border-2 border-dashed border-indigo-200/50 rounded-xl text-indigo-400 text-xs font-bold uppercase tracking-wider hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                    >
                        + New Project
                    </button>
                </Column>

                {/* 2. Next Actions */}
                <Column
                    title="Next Actions"
                    description="Physical, visible actions to take next"
                    icon={CheckCircle2}
                    count={tasks.length}
                    color="emerald"
                >
                    {tasks.map(t => (
                        <ListItem key={t.id} item={t} type="task" />
                    ))}
                    <button
                        onClick={() => setActiveModal('action')}
                        className="w-full py-3 border-2 border-dashed border-emerald-200/50 rounded-xl text-emerald-400 text-xs font-bold uppercase tracking-wider hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                    >
                        + Next Action
                    </button>
                </Column>

                {/* 3. Waiting For */}
                <Column
                    title="Waiting For"
                    description="Items delegated to others"
                    icon={Bell}
                    count={waiting.length}
                    color="amber"
                >
                    {waiting.map(w => (
                        <ListItem key={w.id} item={w} type="waiting" />
                    ))}
                    <button
                        onClick={() => setActiveModal('waiting')}
                        className="w-full py-3 border-2 border-dashed border-amber-200/50 rounded-xl text-amber-400 text-xs font-bold uppercase tracking-wider hover:bg-amber-50 hover:border-amber-300 transition-colors"
                    >
                        + Log Waiting
                    </button>
                </Column>

                {/* 4. Scheduled / Someday */}
                <Column
                    title="Scheduled"
                    description="Time-sensitive actions and appointments"
                    icon={CalendarIcon}
                    count={scheduled.length}
                    color="stone"
                >
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

            {/* Premium Add Modal Overlay */}
            {activeModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/10 backdrop-blur-sm animate-fade-in">
                    <div
                        className="absolute inset-0"
                        onClick={handleCloseModal}
                    ></div>
                    <div className="bg-white rounded-3xl p-8 pb-12 w-full max-w-lg shadow-2xl ring-1 ring-black/5 animate-scale-in relative z-10 overflow-y-auto max-h-[85vh]">
                        <h3 className="text-2xl font-serif font-bold text-stone-900 mb-6 italic">
                            {activeModal === 'project' ? 'Start New Project' :
                                activeModal === 'action' ? 'Add Next Action' : 'Log Waiting For'}
                        </h3>

                        <div className="space-y-6">
                            {/* Main Input */}
                            <div>
                                <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
                                    {activeModal === 'project' ? 'Project Name' : 'Description'}
                                </label>
                                <input
                                    autoFocus
                                    type="text"
                                    className="w-full text-lg font-serif border-b-2 border-stone-100 focus:border-stone-900 outline-none py-2 bg-transparent transition-colors placeholder:text-stone-300 text-stone-800"
                                    placeholder={activeModal === 'project' ? "e.g., Q4 Marketing Strategy" : "e.g., Call John about updates"}
                                    value={newItemText}
                                    onChange={(e) => setNewItemText(e.target.value)}
                                // Removed onEnter here to allow filling other fields
                                />
                            </div>

                            {activeModal === 'waiting' && (
                                <div className="animate-fade-in-up">
                                    <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">
                                        Who are you waiting for?
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full text-base font-serif border-b-2 border-stone-100 focus:border-stone-900 outline-none py-2 bg-transparent transition-colors placeholder:text-stone-300 text-stone-800"
                                        placeholder="e.g., Alice, Client, Approval Board"
                                        value={newItemWho}
                                        onChange={(e) => setNewItemWho(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Extended Options - Always visible for quick access now */}
                            <div className="pt-4 border-t border-stone-100 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Due Date</label>
                                        <input
                                            type="date"
                                            className="w-full text-sm font-sans border-b border-stone-100 focus:border-stone-900 outline-none py-1 bg-transparent text-stone-600"
                                            value={newItemDate}
                                            onChange={(e) => setNewItemDate(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Context</label>
                                        <input
                                            type="text"
                                            placeholder="@office, @home"
                                            className="w-full text-sm font-sans border-b border-stone-100 focus:border-stone-900 outline-none py-1 bg-transparent text-stone-600 placeholder:text-stone-300"
                                            value={newItemContext}
                                            onChange={(e) => setNewItemContext(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Energy / Priority</label>
                                    <div className="flex items-center gap-2">
                                        {['High', 'Medium', 'Low'].map((level) => (
                                            <button
                                                key={level}
                                                onClick={() => setNewItemEnergy(level as 'High' | 'Medium' | 'Low')}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${newItemEnergy === level
                                                    ? 'bg-stone-900 text-white border-stone-900'
                                                    : 'bg-white text-stone-400 border-stone-200 hover:border-stone-400'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Notes</label>
                                    <textarea
                                        className="w-full text-sm font-serif border border-stone-200 rounded-xl p-3 focus:border-stone-900 outline-none bg-stone-50/50 min-h-[80px] text-stone-700 resize-none"
                                        placeholder="Add any additional details..."
                                        value={newItemNotes}
                                        onChange={(e) => setNewItemNotes(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
                                <button
                                    onClick={handleCloseModal}
                                    className="px-6 py-3 rounded-xl text-stone-500 font-bold text-xs uppercase tracking-wider hover:bg-stone-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!newItemText.trim()}
                                    className="px-8 py-3 bg-stone-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
                                >
                                    {activeModal === 'project' ? 'Create Project' : 'Add Item'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

