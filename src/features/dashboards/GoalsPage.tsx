import React, { useState } from 'react';
import {
    Plus, Target, CheckCircle2, MoreHorizontal, Calendar,
    TrendingUp, Activity, Zap, X, ChevronRight, Briefcase
} from 'lucide-react';

// --- Types & Mock Data ---

interface SubGoal {
    id: string;
    title: string;
    completed: boolean;
}

interface Goal {
    id: string;
    title: string;
    category: string;
    dueDate: string;
    progress: number;
    subGoals: SubGoal[];
    status: 'on-track' | 'at-risk' | 'off-track' | 'completed';
    linkToOKR?: string;
    priority: 'High' | 'Medium' | 'Low';
    impact: 'High' | 'Medium' | 'Low';
    description?: string;
}

const CATEGORIES = ['All', 'Quarterly', 'Monthly', 'Personal', 'Work', 'Long-term', 'Completed'];

const MOCK_GOALS: Goal[] = [
    {
        id: '1',
        title: 'Launch MVP for Project Alpha',
        category: 'Work',
        dueDate: 'Oct 30',
        progress: 75,
        status: 'on-track',
        linkToOKR: 'O1: Market Expansion',
        priority: 'High',
        impact: 'High',
        description: 'Successfully launch the Minimum Viable Product for Project Alpha to gather initial user feedback and validate core assumptions.',
        subGoals: [
            { id: '1-1', title: 'Complete core API', completed: true },
            { id: '1-2', title: 'Finalize UI Components', completed: true },
            { id: '1-3', title: 'User Acceptance Testing', completed: false },
            { id: '1-4', title: 'Deploy to Staging', completed: false },
        ]
    },
    {
        id: '2',
        title: 'Design System Overhaul',
        category: 'Work',
        dueDate: 'Nov 15',
        progress: 30,
        status: 'at-risk',
        linkToOKR: 'O3: Design Excellence',
        priority: 'Medium',
        impact: 'High',
        description: 'Revamp the entire design system to improve consistency, scalability, and developer efficiency across all products.',
        subGoals: [
            { id: '2-1', title: 'Audit existing components', completed: true },
            { id: '2-2', title: 'Define new tokens', completed: false },
        ]
    },
    {
        id: '3',
        title: 'Marathon Training',
        category: 'Personal',
        dueDate: 'Dec 12',
        progress: 60,
        status: 'on-track',
        linkToOKR: 'O2: Personal Health',
        priority: 'High',
        impact: 'Medium',
        description: 'Complete training for and successfully run the city marathon, achieving a personal best time.',
        subGoals: [
            { id: '3-1', title: 'Run 10k', completed: true },
            { id: '3-2', title: 'Run 15k', completed: true },
            { id: '3-3', title: 'Run 20k', completed: false },
        ]
    }
];

// --- Styles ---
// Simplified Clean Aesthetic (Removing "Wobbly" Sketchiness for "Right" version improvement)
const s = {
    // Layout
    pageBg: 'bg-[#FDFAF6]', // Very subtle off-white paper
    container: 'max-w-[1400px] mx-auto',
    sectionPadding: 'py-10',

    // Typography
    fontMain: 'font-serif antialiased',
    h1: 'text-5xl font-medium tracking-tight text-gray-900 font-serif',
    h2: 'text-2xl font-bold text-gray-900 font-serif',
    h3: 'text-xl font-bold text-gray-900 font-serif',
    subline: 'text-lg text-gray-500 font-serif italic mt-2',
    navText: 'text-sm font-bold tracking-wide uppercase',

    // Elements
    // Clean, joined button group style based on user image
    btnGroup: 'flex items-stretch border border-gray-900 rounded-sm bg-white shadow-sm hover:shadow-md transition-shadow',
    btnLeft: 'px-6 py-2.5 flex items-center gap-2 text-sm font-bold border-r border-gray-900 hover:bg-gray-50 text-gray-900',
    btnRight: 'px-6 py-2.5 flex items-center gap-2 text-sm font-bold hover:bg-gray-50 text-gray-900',

    tabActive: 'text-black border-b-2 border-black',
    tabInactive: 'text-gray-400 hover:text-gray-600 border-transparent',

    // Visuals
    card: 'relative group py-8 border-b border-gray-200 hover:bg-white/50 transition-colors px-4 -mx-4 rounded-xl',
    progressBarBg: 'h-0.5 w-full bg-gray-200 mt-6',
    progressBarFill: 'h-full bg-black',

    // KPI
    kpiStat: 'text-6xl font-serif text-gray-900 leading-none',
    kpiLabel: 'text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-2',
};

const GoalsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('All');
    const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [showNewModal, setShowNewModal] = useState(false);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalCategory, setNewGoalCategory] = useState('Work');
    const [newGoalDate, setNewGoalDate] = useState('');
    const [newGoalPriority, setNewGoalPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [newGoalDesc, setNewGoalDesc] = useState('');

    const handleSaveGoal = () => {
        if (!newGoalTitle.trim()) return;

        const newGoal: Goal = {
            id: Date.now().toString(),
            title: newGoalTitle,
            category: newGoalCategory,
            dueDate: newGoalDate || new Date().toISOString().split('T')[0],
            progress: 0,
            subGoals: [],
            status: 'on-track',
            priority: newGoalPriority,
            impact: 'Medium',
            description: newGoalDesc
        };

        setGoals([newGoal, ...goals]); // Add to top

        // Reset Form
        setNewGoalTitle('');
        setNewGoalCategory('Work');
        setNewGoalDate('');
        setNewGoalPriority('Medium');
        setNewGoalDesc('');

        setShowNewModal(false);
    };

    const handleUpdateGoal = (updatedGoal: Goal) => {
        setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
        setSelectedGoal(updatedGoal);
    };

    const handleAddMilestone = (goal: Goal, title: string) => {
        const newSub: SubGoal = { id: Date.now().toString(), title, completed: false };
        const updated = { ...goal, subGoals: [...goal.subGoals, newSub] };
        handleUpdateGoal(updated);
    };

    const toggleMilestone = (goal: Goal, subId: string) => {
        const updated = {
            ...goal,
            subGoals: goal.subGoals.map(s => s.id === subId ? { ...s, completed: !s.completed } : s)
        };
        handleUpdateGoal(updated);
    };

    // Derived state for milestone input
    const [milestoneInput, setMilestoneInput] = useState('');

    return (
        <div className={`h-screen w-full ${s.pageBg} ${s.fontMain} relative overflow-hidden flex flex-col`}>
            {/* Background Texture - Subtle */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <div className={`${s.container} px-8 md:px-16 pb-32 relative z-10`}>

                    {/* MATCHED HEADER TO IMAGE */}
                    <header className={`${s.sectionPadding} pt-20 pb-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-8`}>
                        <div>
                            <h1 className={s.h1}>Your Goals</h1>
                            <p className={s.subline}>Strategy, execution, and impact.</p>
                        </div>

                        {/* Clean Button Group - As requested in image */}
                        <div className={s.btnGroup}>
                            <button className={s.btnLeft}>
                                <Briefcase size={16} strokeWidth={2} />
                                New Project
                            </button>
                            <button onClick={() => setShowNewModal(true)} className={s.btnRight}>
                                <Plus size={16} strokeWidth={2} />
                                New Goal
                            </button>
                        </div>
                    </header>

                    {/* TABS */}
                    <nav className="flex items-center gap-8 mb-20 overflow-x-auto pb-1 scrollbar-hide border-b border-gray-200">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`pb-3 transition-colors whitespace-nowrap ${s.navText} ${activeTab === cat ? s.tabActive : s.tabInactive
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </nav>

                    {/* KPI STRIP - Simplified */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
                        <div className="flex flex-col">
                            <span className={s.kpiStat}>12</span>
                            <span className={s.kpiLabel}>Active Goals</span>
                            <div className="flex items-center gap-2 mt-3 text-xs font-bold text-emerald-600">
                                <TrendingUp size={12} /> High Velocity
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className={s.kpiStat}>04</span>
                            <span className={s.kpiLabel}>Completed</span>
                            <div className="flex items-center gap-2 mt-3 text-xs font-bold text-blue-600">
                                <Activity size={12} /> Consistent
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className={s.kpiStat}>85<span className="text-3xl">%</span></span>
                            <span className={s.kpiLabel}>On Track</span>
                            <div className="flex items-center gap-2 mt-3 text-xs font-bold text-amber-600">
                                <Zap size={12} /> Strong Focus
                            </div>
                        </div>
                    </section>

                    {/* --- NEW STRUCTURED LAYOUT --- */}

                    {/* 1. FOCUS / HIGHLIGHT SECTION */}
                    <section className="mb-20">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-2 bg-black text-white rounded-full"><Target size={20} /></div>
                            <h2 className="text-2xl font-serif font-bold">Current Focus</h2>
                        </div>

                        {/* Find Highest Priority Goal */}
                        {goals.filter(g => g.priority === 'High').slice(0, 1).map(goal => (
                            <article
                                key={goal.id}
                                onClick={() => setSelectedGoal(goal)}
                                className={`${s.card} border-l-4 border-l-black bg-white !rounded-r-xl shadow-sm p-8`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="max-w-3xl">
                                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2 block">Top Priority</span>
                                        <h3 className="text-4xl font-serif font-medium mb-4">{goal.title}</h3>
                                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                                            <span className="flex items-center gap-2"><Calendar size={14} /> Due {goal.dueDate}</span>
                                            <span className="flex items-center gap-2"><Briefcase size={14} /> {goal.category}</span>
                                        </div>
                                        {/* Big Progress Bar */}
                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden max-w-md">
                                            <div className="h-full bg-emerald-500" style={{ width: `${goal.progress}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="hidden md:block">
                                        <span className="text-6xl font-serif text-gray-200">{goal.progress}%</span>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </section>

                    {/* 2. CATEGORIZED COLUMNS */}
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">

                        {/* Work Column */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                                <Briefcase size={18} className="text-gray-400" />
                                <h3 className="text-lg font-bold font-serif">Work & Projects</h3>
                                <span className="ml-auto text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">{goals.filter(g => g.category === 'Work').length}</span>
                            </div>
                            {goals.filter(g => g.category === 'Work' && g.priority !== 'High').length === 0 && <p className="text-gray-400 text-sm italic">No other active work goals.</p>}
                            {goals.filter(g => g.category === 'Work').map(goal => (goal.priority !== 'High' &&
                                <div key={goal.id} onClick={() => setSelectedGoal(goal)} className="p-6 bg-white border border-gray-100 rounded-sm hover:shadow-md transition-shadow cursor-pointer group">
                                    <h4 className="text-lg font-serif font-medium mb-2 group-hover:text-amber-700 transition-colors">{goal.title}</h4>
                                    <div className="flex justify-between items-center mt-4">
                                        <span className="text-xs font-bold text-gray-400 uppercase">{goal.dueDate}</span>
                                        <div className="w-16 h-1 bg-gray-100 rounded-full"><div className="h-full bg-black rounded-full" style={{ width: `${goal.progress}%` }}></div></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Personal Column */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                                <Activity size={18} className="text-gray-400" />
                                <h3 className="text-lg font-bold font-serif">Personal & Health</h3>
                                <span className="ml-auto text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">{goals.filter(g => g.category !== 'Work').length}</span>
                            </div>
                            {goals.filter(g => g.category !== 'Work' && g.priority !== 'High').length === 0 && <p className="text-gray-400 text-sm italic">No other active personal goals.</p>}
                            {goals.filter(g => g.category !== 'Work').map(goal => (goal.priority !== 'High' &&
                                <div key={goal.id} onClick={() => setSelectedGoal(goal)} className="p-6 bg-white border border-gray-100 rounded-sm hover:shadow-md transition-shadow cursor-pointer group">
                                    <h4 className="text-lg font-serif font-medium mb-2 group-hover:text-blue-700 transition-colors">{goal.title}</h4>
                                    <div className="flex justify-between items-center mt-4">
                                        <span className="text-xs font-bold text-gray-400 uppercase">{goal.dueDate}</span>
                                        <div className="w-16 h-1 bg-gray-100 rounded-full"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${goal.progress}%` }}></div></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Upcoming / Backlog Column */}
                        <div className="space-y-6 opacity-60 hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                                <Calendar size={18} className="text-gray-400" />
                                <h3 className="text-lg font-bold font-serif">Later</h3>
                            </div>
                            <div className="p-6 border-2 border-dashed border-gray-200 rounded-sm text-center">
                                <p className="text-sm text-gray-400 font-serif italic">Clean up desk</p>
                            </div>
                            <div className="p-6 border-2 border-dashed border-gray-200 rounded-sm text-center">
                                <p className="text-sm text-gray-400 font-serif italic">Read "Deep Work"</p>
                            </div>
                        </div>

                    </section>

                </div>
            </div>

            {/* DRAWER */}
            {selectedGoal && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm" onClick={() => setSelectedGoal(null)}></div>
                    <div className="relative w-full max-w-[600px] h-full bg-white shadow-2xl p-12 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-gray-100 font-serif">
                        <button onClick={() => setSelectedGoal(null)} className="absolute top-8 right-8 text-gray-400 hover:text-black">
                            <X size={24} />
                        </button>

                        <span className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-6">Goal Details</span>

                        {/* Editable Title */}
                        <input
                            type="text"
                            className="w-full text-4xl font-serif font-medium text-gray-900 mb-6 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-black focus:outline-none transition-all"
                            value={selectedGoal.title}
                            onChange={(e) => handleUpdateGoal({ ...selectedGoal, title: e.target.value })}
                        />

                        {/* Editable Description */}
                        <textarea
                            className="w-full text-gray-500 font-serif italic mb-8 bg-gray-50/50 p-4 rounded-sm border-l-2 border-gray-200 focus:border-black focus:outline-none resize-none"
                            value={selectedGoal.description || ''}
                            onChange={(e) => handleUpdateGoal({ ...selectedGoal, description: e.target.value })}
                            placeholder="Add a motivating description..."
                            rows={3}
                        />

                        {/* Meta Grid - Editable */}
                        <div className="grid grid-cols-2 gap-6 mb-10 pb-10 border-b border-gray-100">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Status</label>
                                <select
                                    className="bg-transparent text-xs font-bold uppercase tracking-wide border-b border-gray-200 focus:border-black outline-none py-1 w-full"
                                    value={selectedGoal.status}
                                    onChange={(e) => handleUpdateGoal({ ...selectedGoal, status: e.target.value as any })}
                                >
                                    <option value="on-track">On Track</option>
                                    <option value="at-risk">At Risk</option>
                                    <option value="off-track">Off Track</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Priority</label>
                                <select
                                    className="bg-transparent text-sm font-bold text-gray-900 border-b border-gray-200 focus:border-black outline-none py-1 w-full"
                                    value={selectedGoal.priority}
                                    onChange={(e) => handleUpdateGoal({ ...selectedGoal, priority: e.target.value as any })}
                                >
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Due Date</label>
                                <input
                                    type="date"
                                    className="bg-transparent text-sm font-serif text-gray-900 border-b border-gray-200 focus:border-black outline-none py-1 w-full"
                                    value={selectedGoal.dueDate}
                                    onChange={(e) => handleUpdateGoal({ ...selectedGoal, dueDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Category</label>
                                <select
                                    className="bg-transparent text-sm font-serif text-gray-900 border-b border-gray-200 focus:border-black outline-none py-1 w-full"
                                    value={selectedGoal.category}
                                    onChange={(e) => handleUpdateGoal({ ...selectedGoal, category: e.target.value })}
                                >
                                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <h3 className="text-lg font-bold">Milestones</h3>
                                </div>

                                <div className="space-y-3">
                                    {selectedGoal.subGoals.map(sub => (
                                        <div key={sub.id} className="flex items-center gap-3 group">
                                            <button
                                                onClick={() => toggleMilestone(selectedGoal, sub.id)}
                                                className={`w-4 h-4 rounded-full border border-gray-300 flex-shrink-0 ${sub.completed ? 'bg-black border-black' : 'hover:border-black transition-colors'}`}
                                            ></button>
                                            <input
                                                type="text"
                                                className={`bg-transparent border-none focus:outline-none w-full ${sub.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}
                                                value={sub.title}
                                                onChange={(e) => {
                                                    const newSubs = selectedGoal.subGoals.map(s => s.id === sub.id ? { ...s, title: e.target.value } : s);
                                                    handleUpdateGoal({ ...selectedGoal, subGoals: newSubs });
                                                }}
                                            />
                                            <button
                                                onClick={() => handleUpdateGoal({ ...selectedGoal, subGoals: selectedGoal.subGoals.filter(s => s.id !== sub.id) })}
                                                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}

                                    {/* Add Milestone Input */}
                                    <div className="flex items-center gap-3 mt-4">
                                        <Plus size={16} className="text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Type a new milestone and press Enter..."
                                            className="bg-transparent border-b border-gray-200 focus:border-black outline-none w-full py-1 text-sm font-serif"
                                            value={milestoneInput}
                                            onChange={(e) => setMilestoneInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && milestoneInput.trim()) {
                                                    handleAddMilestone(selectedGoal, milestoneInput);
                                                    setMilestoneInput('');
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>


                            {/* Actions Footer */}
                            <div className="pt-8 border-t border-gray-100 flex flex-col gap-3">
                                <button
                                    onClick={() => setSelectedGoal(null)}
                                    className="w-full py-4 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-sm flex justify-center items-center gap-2"
                                >
                                    Save Changes
                                </button>
                                <button className="w-full py-4 bg-white border border-gray-200 text-gray-900 text-sm font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors rounded-sm flex justify-center items-center gap-2">
                                    <CheckCircle2 size={16} /> Mark as Completed
                                </button>
                                <button className="w-full py-3 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors rounded-sm">
                                    Delete Goal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL */}
            {showNewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-md" onClick={() => setShowNewModal(false)}></div>
                    <div className="relative w-full max-w-lg bg-white p-12 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100 rounded-sm">
                        <h2 className="text-3xl font-serif font-medium mb-2">Create New Goal</h2>
                        <p className="text-gray-500 italic font-serif">What's the next big milestone?</p>

                        <div className="mt-8 space-y-8">
                            {/* Title */}
                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Goal Title</label>
                                <input
                                    type="text"
                                    className="w-full text-xl py-2 border-b border-gray-200 focus:border-black focus:outline-none font-serif placeholder:italic"
                                    placeholder="e.g. Launch Q4 Marketing Campaign..."
                                    value={newGoalTitle}
                                    onChange={(e) => setNewGoalTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Row 2: Category & Priority */}
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-3">Category</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Work', 'Personal', 'Health'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setNewGoalCategory(cat)}
                                                className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider border transition-colors ${newGoalCategory === cat
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-black'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-3">Priority</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['High', 'Medium', 'Low'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setNewGoalPriority(p as any)}
                                                className={`px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-wider border transition-colors ${newGoalPriority === p
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-500 border-gray-200 hover:border-black'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Row 3: Due Date & Description */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Target Date</label>
                                    <input
                                        type="date"
                                        className="w-full py-2 border-b border-gray-200 focus:border-black focus:outline-none font-serif text-gray-800"
                                        value={newGoalDate}
                                        onChange={(e) => setNewGoalDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Description (Optional)</label>
                                <textarea
                                    className="w-full py-2 border-b border-gray-200 focus:border-black focus:outline-none font-serif text-gray-800 resize-none h-20"
                                    placeholder="Add some context or success criteria..."
                                    value={newGoalDesc}
                                    onChange={(e) => setNewGoalDesc(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex justify-between items-center pt-4">
                                <button onClick={() => setShowNewModal(false)} className="text-sm font-bold text-gray-400 hover:text-black">Cancel</button>
                                <button onClick={handleSaveGoal} className="px-8 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 rounded-sm">Save Goal</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default GoalsPage;
