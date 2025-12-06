import React, { useState, useEffect } from 'react';
import {
    Plus, Target, CheckCircle2, Calendar,
    TrendingUp, Activity, Zap, X, Briefcase
} from 'lucide-react';
import { goalsService, Goal, SubGoal } from '../goals/goalsService';
import { DatePicker } from '../tasks/components/DatePicker';

// --- Styles ---
const s = {
    // Layout
    pageBg: 'bg-stone-50',
    container: 'w-full',
    sectionPadding: 'py-10',

    // Typography
    fontMain: 'font-serif antialiased',
    h1: 'text-5xl font-medium tracking-tight text-gray-900 font-serif',
    h2: 'text-2xl font-bold text-gray-900 font-serif',
    h3: 'text-xl font-bold text-gray-900 font-serif',
    subline: 'text-lg text-gray-500 font-serif italic mt-2',
    navText: 'text-sm font-bold tracking-wide uppercase',

    // Elements
    btnGroup: 'flex items-stretch border border-gray-900 rounded-sm bg-white shadow-sm hover:shadow-md transition-shadow',
    btnLeft: 'px-6 py-2.5 flex items-center gap-2 text-sm font-bold border-r border-gray-900 hover:bg-gray-50 text-gray-900',
    btnRight: 'px-6 py-2.5 flex items-center gap-2 text-sm font-bold hover:bg-gray-50 text-gray-900',

    tabActive: 'text-black border-b-2 border-black',
    tabInactive: 'text-gray-400 hover:text-gray-600 border-transparent',

    // Visuals
    card: 'relative group py-8 px-6 -mx-4 rounded-xl transition-all duration-300 border border-transparent',
    // Lighter, simpler completed style
    cardCompleted: 'bg-white/50 border-gray-100 shadow-none opacity-60 hover:opacity-100 transition-opacity',
    cardActive: 'hover:bg-white/50 border-b-gray-200 border-b',

    // Glowing Dot - HD & Bigger
    glowingDot: 'w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_15px_3px_rgba(52,211,153,0.9),0_0_30px_6px_rgba(16,185,129,0.5)] border border-white/20',

    progressBarBg: 'h-0.5 w-full bg-gray-200 mt-6',
    progressBarFill: 'h-full bg-black',

    // KPI
    kpiStat: 'text-6xl font-serif text-gray-900 leading-none',
    kpiLabel: 'text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-2',
};

const CATEGORIES = ['All', 'Quarterly', 'Monthly', 'Personal', 'Work', 'Long-term', 'Completed'];

const GoalsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('All');
    const [goals, setGoals] = useState<Goal[]>([]);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [showNewModal, setShowNewModal] = useState(false);

    // Form State
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [newGoalCategory, setNewGoalCategory] = useState('Work');
    const [newGoalDate, setNewGoalDate] = useState('');
    const [newGoalPriority, setNewGoalPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
    const [newGoalDesc, setNewGoalDesc] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false); // For modal date picker

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        setLoading(true);
        try {
            const data = await goalsService.getGoals();
            setGoals(data);
        } catch (error) {
            console.error("Failed to load goals", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveGoal = async () => {
        if (!newGoalTitle.trim()) return;

        const newGoalData: Omit<Goal, 'id'> = {
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

        try {
            const savedGoal = await goalsService.createGoal(newGoalData);
            setGoals([savedGoal, ...goals]); // Add to top locally

            // Reset Form
            setNewGoalTitle('');
            setNewGoalCategory('Work');
            setNewGoalDate('');
            setNewGoalPriority('Medium');
            setNewGoalDesc('');
            setShowNewModal(false);
        } catch (error) {
            console.error("Failed to save goal", error);
            alert("Failed to save goal. Please check the server connection.");
        }
    };

    const handleUpdateGoal = async (updatedGoal: Goal) => {
        // Optimistic update
        setGoals(goals.map(g => g.id === updatedGoal.id ? updatedGoal : g));
        setSelectedGoal(updatedGoal);

        try {
            await goalsService.updateGoal(updatedGoal);
        } catch (error) {
            console.error("Failed to update goal", error);
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        if (!confirm("Are you sure you want to delete this goal?")) return;

        try {
            await goalsService.deleteGoal(goalId);
            setGoals(goals.filter(g => g.id !== goalId));
            setSelectedGoal(null);
        } catch (error) {
            console.error("Failed to delete goal", error);
        }
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
        // Auto-calc progress
        if (updated.subGoals.length > 0) {
            const completedCount = updated.subGoals.filter(s => s.completed).length;
            updated.progress = Math.round((completedCount / updated.subGoals.length) * 100);
        }

        handleUpdateGoal(updated);
    };

    // Derived state for milestone input
    const [milestoneInput, setMilestoneInput] = useState('');

    // Filter goals
    const filteredGoals = activeTab === 'All'
        ? goals
        : activeTab === 'Completed'
            ? goals.filter(g => g.status === 'completed' || g.progress === 100)
            : goals.filter(g => g.category === activeTab);

    // Date formatter
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    };

    return (
        <div className={`h-screen w-full ${s.pageBg} ${s.fontMain} relative overflow-hidden flex flex-col`}>
            {/* Background Texture*/}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <div className={`${s.container} px-8 md:px-16 pb-32 relative z-10`}>

                    {/* MATCHED HEADER TO IMAGE */}
                    <header className={`${s.sectionPadding} pt-20 pb-16 flex flex-col md:flex-row justify-between items-end gap-8`}>
                        <div>
                            <h1 className={s.h1}>Your Goals</h1>
                            <p className={s.subline}>Strategy, execution, and impact.</p>
                        </div>

                        {/* Clean Button Group */}
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

                    {/* KPI STRIP */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
                        <div className="flex flex-col">
                            <span className={s.kpiStat}>{goals.filter(g => g.status !== 'completed').length}</span>
                            <span className={s.kpiLabel}>Active Goals</span>
                            <div className="flex items-center gap-2 mt-3 text-xs font-bold text-emerald-600">
                                <TrendingUp size={12} /> High Velocity
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className={s.kpiStat}>{goals.filter(g => g.status === 'completed' || g.progress === 100).length}</span>
                            <span className={s.kpiLabel}>Completed</span>
                            <div className="flex items-center gap-2 mt-3 text-xs font-bold text-blue-600">
                                <Activity size={12} /> Consistent
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className={s.kpiStat}>
                                {goals.length > 0 ? Math.round(goals.filter(g => g.status === 'on-track').length / goals.length * 100) : 0}
                                <span className="text-3xl">%</span>
                            </span>
                            <span className={s.kpiLabel}>On Track</span>
                            <div className="flex items-center gap-2 mt-3 text-xs font-bold text-amber-600">
                                <Zap size={12} /> Strong Focus
                            </div>
                        </div>
                    </section>

                    {loading ? (
                        <div className="text-center py-20 text-gray-400 italic">Loading your vision...</div>
                    ) : (
                        <>
                            {/* --- NEW STRUCTURED LAYOUT --- */}

                            {/* 1. FOCUS / HIGHLIGHT SECTION */}
                            {filteredGoals.some(g => g.priority === 'High') && (
                                <section className="mb-20">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="p-2 bg-black text-white rounded-full"><Target size={20} /></div>
                                        <h2 className="text-2xl font-serif font-bold">Current Focus</h2>
                                    </div>

                                    {/* Find Highest Priority Goal */}
                                    {filteredGoals.filter(g => g.priority === 'High').slice(0, 1).map(goal => {
                                        const isCompleted = goal.status === 'completed' || goal.progress === 100;
                                        return (
                                            <article
                                                key={goal.id}
                                                onClick={() => setSelectedGoal(goal)}
                                                className={`${s.card} ${isCompleted ? s.cardCompleted : `${s.cardActive} border-l-4 border-l-black !rounded-r-xl`} shadow-sm p-8 cursor-pointer`}
                                            >
                                                {isCompleted && (
                                                    <div className="absolute top-8 right-8">
                                                        <div className={s.glowingDot} />
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-start">
                                                    <div className="max-w-3xl w-full">
                                                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2 block">Top Priority</span>
                                                        <h3 className="text-4xl font-serif font-medium mb-4">{goal.title}</h3>
                                                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                                                            <span className="flex items-center gap-2"><Calendar size={14} /> Due {formatDate(goal.dueDate)}</span>
                                                            <span className="flex items-center gap-2"><Briefcase size={14} /> {goal.category}</span>
                                                        </div>
                                                        {/* Big Progress Bar */}
                                                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden max-w-md">
                                                            <div className={`h-full ${isCompleted ? 'bg-black' : 'bg-emerald-500'}`} style={{ width: `${goal.progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <div className="hidden md:block">
                                                        <span className="text-6xl font-serif text-gray-200">{goal.progress}%</span>
                                                    </div>
                                                </div>
                                            </article>
                                        )
                                    })}
                                </section>
                            )}

                            {/* 2. CATEGORIZED COLUMNS */}
                            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">

                                {/* Work Column */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                                        <Briefcase size={18} className="text-gray-400" />
                                        <h3 className="text-lg font-bold font-serif">Work & Projects</h3>
                                        <span className="ml-auto text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">{filteredGoals.filter(g => g.category === 'Work').length}</span>
                                    </div>
                                    {filteredGoals.filter(g => g.category === 'Work' && g.priority !== 'High').length === 0 && <p className="text-gray-400 text-sm italic">No other active work goals.</p>}
                                    {filteredGoals.filter(g => g.category === 'Work').map(goal => {
                                        if (goal.priority === 'High') return null;
                                        const isCompleted = goal.status === 'completed' || goal.progress === 100;
                                        return (
                                            <div key={goal.id} onClick={() => setSelectedGoal(goal)}
                                                className={`${s.card} ${isCompleted ? s.cardCompleted : s.cardActive} p-6 cursor-pointer group`}
                                            >
                                                {isCompleted && (
                                                    <div className="absolute top-6 right-6">
                                                        <div className={s.glowingDot} />
                                                    </div>
                                                )}
                                                <h4 className="text-lg font-serif font-medium mb-2 group-hover:text-amber-700 transition-colors">{goal.title}</h4>
                                                <div className="flex justify-between items-center mt-4">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">{formatDate(goal.dueDate)}</span>
                                                    <div className="w-16 h-1 bg-gray-100 rounded-full"><div className={`h-full rounded-full ${isCompleted ? 'bg-black' : 'bg-black'}`} style={{ width: `${goal.progress}%` }}></div></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Personal Column */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                                        <Activity size={18} className="text-gray-400" />
                                        <h3 className="text-lg font-bold font-serif">Personal & Health</h3>
                                        <span className="ml-auto text-xs font-bold bg-gray-100 px-2 py-1 rounded-full">{filteredGoals.filter(g => g.category !== 'Work').length}</span>
                                    </div>
                                    {filteredGoals.filter(g => g.category !== 'Work' && g.priority !== 'High').length === 0 && <p className="text-gray-400 text-sm italic">No other active personal goals.</p>}
                                    {filteredGoals.filter(g => g.category !== 'Work').map(goal => {
                                        if (goal.priority === 'High') return null;
                                        const isCompleted = goal.status === 'completed' || goal.progress === 100;
                                        return (
                                            <div key={goal.id} onClick={() => setSelectedGoal(goal)}
                                                className={`${s.card} ${isCompleted ? s.cardCompleted : s.cardActive} p-6 cursor-pointer group`}
                                            >
                                                {isCompleted && (
                                                    <div className="absolute top-6 right-6">
                                                        <div className={s.glowingDot} />
                                                    </div>
                                                )}
                                                <h4 className="text-lg font-serif font-medium mb-2 group-hover:text-blue-700 transition-colors">{goal.title}</h4>
                                                <div className="flex justify-between items-center mt-4">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">{formatDate(goal.dueDate)}</span>
                                                    <div className="w-16 h-1 bg-gray-100 rounded-full"><div className={`h-full rounded-full ${isCompleted ? 'bg-black' : 'bg-blue-500'}`} style={{ width: `${goal.progress}%` }}></div></div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Later / Ideas */}
                                <div className="space-y-6 opacity-60 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                                        <Calendar size={18} className="text-gray-400" />
                                        <h3 className="text-lg font-bold font-serif">Later</h3>
                                    </div>
                                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-sm text-center">
                                        <p className="text-sm text-gray-400 font-serif italic">Clean up desk</p>
                                    </div>
                                </div>

                            </section>
                        </>
                    )}
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

                        <input
                            type="text"
                            className="w-full text-4xl font-serif font-medium text-gray-900 mb-6 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-black focus:outline-none transition-all"
                            value={selectedGoal.title}
                            onChange={(e) => handleUpdateGoal({ ...selectedGoal, title: e.target.value })}
                        />

                        <textarea
                            className="w-full text-gray-500 font-serif italic mb-8 bg-gray-50/50 p-4 rounded-sm border-l-2 border-gray-200 focus:border-black focus:outline-none resize-none"
                            value={selectedGoal.description || ''}
                            onChange={(e) => handleUpdateGoal({ ...selectedGoal, description: e.target.value })}
                            placeholder="Add a motivating description..."
                            rows={3}
                        />

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
                        </div>

                        <div className="space-y-8">
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <h3 className="text-lg font-bold">Milestones</h3>
                                </div>
                                <div className="space-y-3">
                                    {selectedGoal.subGoals && selectedGoal.subGoals.map(sub => (
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

                            <div className="pt-8 border-t border-gray-100 flex flex-col gap-3">
                                <button
                                    onClick={() => setSelectedGoal(null)}
                                    className="w-full py-4 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-sm flex justify-center items-center gap-2"
                                >
                                    Close Details
                                </button>
                                <button
                                    onClick={() => handleUpdateGoal({ ...selectedGoal, status: 'completed', progress: 100 })}
                                    className="w-full py-4 bg-white border border-gray-200 text-gray-900 text-sm font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors rounded-sm flex justify-center items-center gap-2">
                                    <CheckCircle2 size={16} /> Mark as Completed
                                </button>
                                <button
                                    onClick={() => handleDeleteGoal(selectedGoal.id)}
                                    className="w-full py-3 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-colors rounded-sm">
                                    Delete Goal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* NEW GOAL MODAL - REDESIGNED */}
            {showNewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" onClick={() => { setShowNewModal(false); setShowDatePicker(false); }}></div>
                    <div className="relative w-full max-w-[600px] bg-white p-12 shadow-[0_20px_50px_rgba(0,0,0,0.1)] animate-in zoom-in-95 duration-300 rounded-[2px]" onClick={() => setShowDatePicker(false)}>

                        <h2 className="text-[32px] font-serif text-gray-900 leading-tight mb-2">Create New Goal</h2>
                        <p className="text-[16px] text-gray-500 italic font-serif mb-10">What's the next big milestone?</p>

                        <div className="space-y-8" onClick={(e) => e.stopPropagation()}>
                            {/* GOAL TITLE */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-3">Goal Title</label>
                                <input
                                    type="text"
                                    className="w-full text-2xl font-serif text-gray-900 pb-2 border-b-2 border-gray-900 focus:border-black focus:outline-none placeholder:text-gray-300"
                                    placeholder="Enter goal..."
                                    value={newGoalTitle}
                                    onChange={(e) => setNewGoalTitle(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-12">
                                {/* CATEGORY */}
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4">Category</label>
                                    <div className="flex flex-col gap-3">
                                        {['WORK', 'PERSONAL', 'HEALTH'].map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setNewGoalCategory(cat.charAt(0) + cat.slice(1).toLowerCase())}
                                                className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-left w-full transition-all border ${newGoalCategory.toUpperCase() === cat
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                                                    }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* PRIORITY */}
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-4">Priority</label>
                                    <div className="flex flex-col gap-3">
                                        {['HIGH', 'MEDIUM', 'LOW'].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => setNewGoalPriority(p.charAt(0) + p.slice(1).toLowerCase() as any)}
                                                className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-left w-full transition-all border ${newGoalPriority.toUpperCase() === p
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-400 border-gray-200 hover:border-gray-900 hover:text-gray-900'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* TARGET DATE - WITH DATE PICKER */}
                            <div className="pt-2 relative">
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-3">Target Date</label>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowDatePicker(!showDatePicker); }}
                                    className="w-full text-left text-lg font-serif text-gray-900 pb-2 border-b border-gray-200 hover:border-black focus:outline-none transition-colors"
                                >
                                    {newGoalDate ?
                                        new Date(newGoalDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                                        : <span className="text-gray-300">MM/DD/YYYY</span>}
                                </button>

                                {showDatePicker && (
                                    <div className="absolute top-full left-0 mt-4 z-[60] shadow-2xl">
                                        <DatePicker
                                            date={newGoalDate}
                                            onSelect={(d) => { setNewGoalDate(d); setShowDatePicker(false); }}
                                            onClose={() => setShowDatePicker(false)}
                                            compact={true}
                                            className="shadow-2xl border border-gray-100"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* DESCRIPTION */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 block mb-3">Description (Optional)</label>
                                <textarea
                                    className="w-full text-base font-serif text-gray-600 pb-2 border-b border-gray-200 focus:border-black focus:outline-none resize-none h-24 bg-transparent"
                                    placeholder="Add some context or success criteria..."
                                    value={newGoalDesc}
                                    onChange={(e) => setNewGoalDesc(e.target.value)}
                                ></textarea>
                            </div>

                            {/* FOOTER ACTIONS */}
                            <div className="flex justify-between items-center pt-8 mt-4">
                                <button
                                    onClick={() => setShowNewModal(false)}
                                    className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveGoal}
                                    className="px-8 py-4 bg-black text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition-colors shadow-lg"
                                >
                                    Save Goal
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default GoalsPage;
