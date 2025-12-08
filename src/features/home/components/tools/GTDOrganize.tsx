// ... imports
import React, { useState } from 'react';
import { CheckCircle2, Bell, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MoreHorizontal, Layers, Archive, User, FileText, Plus, Trash2 } from 'lucide-react';
import { GTDItem, Project } from '../GTDSystemWidget';

interface GTDOrganizeProps {
    projects: Project[];
    items: GTDItem[];
    onUpdateItem: (id: number, updates: Partial<GTDItem>) => void;
    onAddProject: (name: string) => void;
    onAddItem: (item: Partial<GTDItem>) => void;
    onDelete: (id: number) => void;
}

export const GTDOrganize = ({ projects, items, onUpdateItem, onAddProject, onAddItem, onDelete }: GTDOrganizeProps) => {
    // Filter items
    const tasks = items.filter(i => i.status === 'actionable' && !i.dueDate);
    const scheduled = items.filter(i => (i.status === 'actionable' || i.status === 'waiting') && i.dueDate).sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0));
    const waiting = items.filter(i => i.status === 'waiting');
    const someday = items.filter(i => i.status === 'someday');
    const reference = items.filter(i => i.status === 'reference');
    // Show recent done items (or all done items)
    const completed = items.filter(i => i.status === 'done').sort((a, b) => b.createdAt - a.createdAt);

    // Modal State
    const [activeModal, setActiveModal] = useState<'project' | 'action' | 'waiting' | 'someday' | 'reference' | null>(null);
    const [newItemText, setNewItemText] = useState('');
    const [newItemWho, setNewItemWho] = useState('');
    const [newItemDate, setNewItemDate] = useState('');
    const [newItemEnergy, setNewItemEnergy] = useState<'High' | 'Medium' | 'Low' | null>(null);
    const [newItemContext, setNewItemContext] = useState(''); // e.g., @home
    const [newItemNotes, setNewItemNotes] = useState('');

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
        } else if (activeModal === 'someday') {
            onAddItem({
                text: newItemText,
                status: 'someday',
                ...commonFields
            });
        } else if (activeModal === 'reference') {
            onAddItem({
                text: newItemText,
                status: 'reference',
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

    // Helper for "New" items (created today)
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const isNewToday = (timestamp: number) => timestamp >= startOfToday;

    const Column = ({ title, description, icon: Icon, count, children, onAdd, addLabel, newCount, color = "text-stone-400" }: any) => {
        return (
            <div className="group">
                {/* Section Header - Matching Reflect with Stats */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Icon size={20} className={`${color} opacity-80`} />
                        <h3 className="text-xl font-serif font-bold text-stone-800">{title}</h3>
                        {onAdd && (
                            <button
                                onClick={onAdd}
                                className="ml-2 p-1 text-stone-300 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                                title={addLabel}
                            >
                                <Plus size={16} />
                            </button>
                        )}
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 bg-stone-50 px-2 py-1 rounded-full border border-stone-100">
                            <span>Total: {count}</span>
                            {newCount > 0 && (
                                <>
                                    <span className="text-stone-300">|</span>
                                    <span className={color}>New: {newCount}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* List Area - Clean with left border line matching Reflect */}
                <div className="space-y-1 pl-2 md:pl-8 border-l border-stone-100 group-hover:border-stone-200 transition-colors max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                    {children}
                </div>
            </div>
        );
    };

    const ListItem = ({ item, type = "task" }: { item: any, type?: "task" | "project" | "waiting" | "simple" }) => (
        <div className="group py-3 px-2 flex items-start justify-between gap-4 border-b border-stone-100/50 hover:border-stone-100 hover:bg-stone-50/50 rounded-lg transition-all cursor-pointer relative">
            <div className="flex-1">
                <p className={`font-serif text-sm leading-snug ${type === 'simple' ? 'text-stone-500' : 'text-stone-800 font-medium'}`}>
                    {type === 'project' ? item.name : item.text}
                </p>

                {/* Meta Row */}
                <div className="flex flex-wrap gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {type === 'waiting' && item.delegatedTo && (
                        <span className="text-[10px] uppercase font-bold text-amber-500">Waiting: {item.delegatedTo}</span>
                    )}
                    {item.dueDate && (
                        <span className="text-[10px] uppercase font-bold text-stone-400">{new Date(item.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    )}
                    {item.progress !== undefined && (
                        <span className="text-[10px] uppercase font-bold text-indigo-500">{item.progress}% Done</span>
                    )}
                </div>
            </div>

            {/* Status / Indicator & Actions Wrapper */}
            <div className="flex items-start gap-3 min-w-fit">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this item?')) {
                            onDelete(item.id);
                        }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-red-500 transition-all"
                    title="Delete"
                >
                    <Trash2 size={14} />
                </button>

                <div className="mt-1">
                    {type === 'project' && <div className="h-1.5 w-1.5 rounded-full bg-stone-900" />}
                    {type === 'task' && <div className="h-3 w-3 rounded-full border border-stone-300 group-hover:border-emerald-500 transition-colors" />}
                    {type === 'waiting' && <Clock size={14} className="text-stone-300 group-hover:text-amber-500" />}
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full min-h-[600px] flex flex-col font-serif p-6 max-w-[90rem] mx-auto w-full">
            {/* Header - Centered & Clean (Matching Reflect) */}
            <div className="flex flex-col items-center justify-center mb-8 pb-6 border-b border-stone-100">
                <div className="text-center mb-6">
                    <h1 className="text-4xl md:text-5xl font-bold font-serif text-stone-900 uppercase tracking-widest select-none">
                        Organize
                    </h1>
                    <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-2">
                        Clarify outcomes & next actions
                    </p>
                </div>
            </div>

            {/* 3x3 Grid Layout (lg:grid-cols-3) - Matching Reflect spacing */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-2">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8 pb-12">

                    {/* 1. Projects */}
                    <Column
                        title="Projects"
                        description="Outcomes requiring multiple steps."
                        icon={Layers}
                        count={projects.filter(p => p.status === 'active').length}
                        newCount={projects.filter(p => p.status === 'active' && isNewToday(p.id)).length}
                        color="text-indigo-500"
                        onAdd={() => setActiveModal('project')}
                        addLabel="New Project"
                    >
                        {projects.filter(p => p.status === 'active').map(p => {
                            // Calculate Progress
                            const totalTasks = p.items.length;
                            const completedTasks = p.items.filter(id => items.find(i => i.id === id)?.status === 'done').length;
                            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                            return (
                                <ListItem key={p.id} item={{ ...p, progress }} type="project" />
                            );
                        })}
                    </Column>

                    {/* 2. Next Actions */}
                    <Column
                        title="Next Actions"
                        description="Physical, visible actions to take next."
                        icon={CheckCircle2}
                        count={tasks.length}
                        newCount={tasks.filter(t => isNewToday(t.createdAt)).length}
                        color="text-emerald-500"
                        onAdd={() => setActiveModal('action')}
                        addLabel="Next Action"
                    >
                        {tasks.map(t => (
                            <ListItem key={t.id} item={t} type="task" />
                        ))}
                    </Column>

                    {/* 3. Waiting For */}
                    <Column
                        title="Waiting For"
                        description="Items delegated to others."
                        icon={Bell}
                        count={waiting.length}
                        newCount={waiting.filter(w => isNewToday(w.createdAt)).length}
                        color="text-amber-500"
                        onAdd={() => setActiveModal('waiting')}
                        addLabel="Log Waiting"
                    >
                        {waiting.map(w => (
                            <ListItem key={w.id} item={w} type="waiting" />
                        ))}
                    </Column>

                    {/* 4. Scheduled */}
                    <Column
                        title="Scheduled"
                        description="Time-sensitive actions & events."
                        icon={CalendarIcon}
                        count={scheduled.length}
                        newCount={scheduled.filter(s => isNewToday(s.createdAt)).length}
                        color="text-blue-500"
                    >
                        {scheduled.map(s => (
                            <div key={s.id} className="py-3 px-2 border-b border-transparent hover:bg-stone-50 rounded-lg group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 text-center leading-none">
                                        <span className="block text-[10px] font-bold text-stone-400 uppercase">{s.dueDate ? new Date(s.dueDate).toLocaleDateString(undefined, { month: 'short' }) : ''}</span>
                                        <span className="block text-xl font-serif font-bold text-stone-900">{s.dueDate ? new Date(s.dueDate).getDate() : ''}</span>
                                    </div>
                                    <span className="text-sm font-serif font-medium text-stone-800">{s.text}</span>
                                </div>
                            </div>
                        ))}
                        {scheduled.length === 0 && <span className="text-stone-300 text-xs italic p-2">Nothing scheduled.</span>}
                    </Column>

                    {/* 5. Someday / Maybe */}
                    <Column
                        title="Someday / Maybe"
                        description="Ideas for the future."
                        icon={Clock}
                        count={someday.length}
                        newCount={someday.filter(s => isNewToday(s.createdAt)).length}
                        color="text-stone-400"
                        onAdd={() => setActiveModal('someday')}
                        addLabel="Add Idea"
                    >
                        {someday.map(s => (
                            <ListItem key={s.id} item={s} type="simple" />
                        ))}
                    </Column>

                    {/* 6. Reference */}
                    <Column
                        title="Reference"
                        description="Information to keep."
                        icon={FileText}
                        count={reference.length}
                        newCount={reference.filter(r => isNewToday(r.createdAt)).length}
                        color="text-stone-500"
                        onAdd={() => setActiveModal('reference')}
                        addLabel="Add Reference"
                    >
                        {reference.map(r => (
                            <ListItem key={r.id} item={r} type="simple" />
                        ))}
                    </Column>

                </div>
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
                                activeModal === 'action' ? 'Add Next Action' :
                                    activeModal === 'someday' ? 'Someday / Maybe' :
                                        activeModal === 'reference' ? 'Add Reference' : 'Log Waiting For'}
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
