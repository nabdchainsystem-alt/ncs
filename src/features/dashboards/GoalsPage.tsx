import React, { useState } from 'react';
import {
    Plus, Target, CheckCircle2, MoreHorizontal, Calendar,
    TrendingUp, Activity, Zap, X, ChevronRight, BarChart3,
    Clock, Layout, PieChart, ArrowUpRight
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
    consistencyScore: number; // 0-100
    habitStreak: number; // days
    impactLevel: 'High' | 'Medium' | 'Low';
    priority: 'High' | 'Medium' | 'Low';
}

const CATEGORIES = ['All Goals', 'Quarterly', 'Monthly', 'Personal', 'Work', 'Long-term', 'Completed'];

const MOCK_GOALS: Goal[] = [
    {
        id: '1',
        title: 'Launch MVP for Project Alpha',
        category: 'Work',
        dueDate: 'Oct 30',
        progress: 75,
        status: 'on-track',
        linkToOKR: 'O1: Market Expansion',
        consistencyScore: 92,
        habitStreak: 12,
        impactLevel: 'High',
        priority: 'High',
        subGoals: [
            { id: '1-1', title: 'Complete core API modules', completed: true },
            { id: '1-2', title: 'Finalize UI Components', completed: true },
            { id: '1-3', title: 'User Acceptance Testing', completed: false },
            { id: '1-4', title: 'Deploy to Staging', completed: false },
        ]
    },
    {
        id: '2',
        title: 'Improve Physical Health',
        category: 'Personal',
        dueDate: 'Dec 31',
        progress: 45,
        status: 'at-risk',
        linkToOKR: 'O2: Personal Wellbeing',
        consistencyScore: 65,
        habitStreak: 4,
        impactLevel: 'High',
        priority: 'Medium',
        subGoals: [
            { id: '2-1', title: 'Gym 3x per week', completed: true },
            { id: '2-2', title: 'Meal prep Sundays', completed: false },
            { id: '2-3', title: '8h Sleep average', completed: false },
        ]
    },
    {
        id: '3',
        title: 'Team Capacity Building',
        category: 'Work',
        dueDate: 'Nov 15',
        progress: 20,
        status: 'on-track',
        linkToOKR: 'O3: Team Growth',
        consistencyScore: 88,
        habitStreak: 8,
        impactLevel: 'Medium',
        priority: 'Medium',
        subGoals: [
            { id: '3-1', title: 'Hire Senior Frontend Dev', completed: false },
            { id: '3-2', title: 'Conduct Q4 Reviews', completed: false },
        ]
    }
];

// --- Shared Components ---

// Variant-based styling helper
type StyleVariant = 'modern' | 'sketch';

const getStyles = (variant: StyleVariant) => {
    const isModern = variant === 'modern';

    return {
        // Containers
        pageBg: isModern ? 'bg-white' : 'bg-[#fdfdfd]',
        card: isModern
            ? 'bg-white rounded-2xl shadow-sm border border-gray-100'
            : 'bg-transparent border-2 border-gray-800 rounded-sm shadow-none',

        // Typography
        h1: isModern ? 'text-4xl font-black tracking-tight text-gray-900' : 'text-4xl font-serif italic text-gray-800 font-bold',
        h2: isModern ? 'text-xl font-bold text-gray-900' : 'text-xl font-serif text-gray-800 font-bold underline decoration-wavy decoration-gray-400',
        h3: isModern ? 'text-lg font-bold text-gray-900' : 'text-lg font-serif font-bold text-gray-900',
        text: isModern ? 'text-gray-600 font-medium' : 'text-gray-700 font-serif',
        label: isModern ? 'text-xs font-bold text-gray-400 uppercase tracking-wider' : 'text-xs font-serif font-bold text-gray-600 uppercase',

        // Elements
        buttonPrimary: isModern
            ? 'bg-black text-white rounded-xl shadow-lg shadow-black/20 hover:-translate-y-0.5 transition-transform font-bold'
            : 'bg-transparent border-2 border-dashed border-gray-900 text-gray-900 font-serif font-bold hover:bg-gray-100',
        buttonSecondary: isModern
            ? 'bg-gray-100 text-gray-900 rounded-lg font-bold hover:bg-gray-200'
            : 'border border-gray-400 text-gray-800 font-serif hover:border-gray-900',

        pill: isModern
            ? 'bg-gray-50 text-gray-600 border border-gray-100'
            : 'border border-gray-600 rounded-full font-serif text-gray-700',
        pillActive: isModern
            ? 'bg-black text-white shadow-md'
            : 'bg-gray-800 text-white border-2 border-gray-900 font-serif transform -rotate-1',

        // Utilities
        divider: isModern ? 'border-gray-100' : 'border-gray-300 border-dashed',
        progressBarBg: isModern ? 'bg-gray-100' : 'bg-transparent border border-gray-400',
        progressBarFill: isModern ? 'bg-black' : 'bg-gray-800 pattern-diagonal-lines',

        // Interactive
        input: isModern
            ? 'bg-gray-50 border-transparent focus:bg-white focus:border-black focus:ring-0 rounded-xl font-medium'
            : 'bg-transparent border-b-2 border-gray-400 focus:border-black rounded-none font-serif',
    };
};

const GoalsLayout: React.FC<{ variant: StyleVariant }> = ({ variant }) => {
    const s = getStyles(variant);
    const [activeTab, setActiveTab] = useState('All Goals');
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const [showNewGoalModal, setShowNewGoalModal] = useState(false);

    // Render Helpers
    const renderProgressBar = (progress: number) => (
        <div className={`h-2 rounded-full overflow-hidden w-full ${s.progressBarBg}`}>
            <div
                className={`h-full ${s.progressBarFill}`}
                style={{ width: `${progress}%`, transition: 'width 1s ease' }}
            ></div>
        </div>
    );

    return (
        <div className={`p-8 min-h-screen relative font-sans ${s.pageBg} overflow-hidden font-antialiased`}>
            <div className={`${variant === 'sketch' ? 'opacity-90' : ''} max-w-[1248px] mx-auto`}>

                {/* --- 1. Mini Hero Section --- */}
                <div className={`flex justify-between items-end mb-12 ${variant === 'sketch' ? 'p-4 border-b-2 border-gray-200 border-dashed' : ''}`}>
                    <div>
                        <h1 className={`${s.h1} mb-2`}>Your Goals</h1>
                        <p className={`text-lg ${s.text}`}>Define what really matters and track progress with clarity.</p>
                    </div>
                    <button
                        onClick={() => setShowNewGoalModal(true)}
                        className={`px-6 py-3 flex items-center gap-2 ${s.buttonPrimary}`}
                    >
                        <Plus size={18} strokeWidth={variant === 'sketch' ? 3 : 2.5} />
                        <span>New Goal</span>
                    </button>
                </div>

                {/* --- 2. Category Tabs --- */}
                <div className={`mb-10 overflow-x-auto pb-2 scrollbar-hide`}>
                    <div className={`inline-flex gap-3 p-1.5 ${variant === 'modern' ? 'bg-white border border-gray-100 rounded-full shadow-sm' : ''}`}>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveTab(cat)}
                                className={`px-5 py-2 text-sm rounded-full transition-all whitespace-nowrap ${activeTab === cat ? s.pillActive : s.pill
                                    } ${activeTab !== cat && variant === 'modern' ? 'hover:bg-gray-50' : ''}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- 3. Performance KPI Snapshot --- */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Card 1 */}
                    <div className={`${s.card} p-6 relative group overflow-hidden`}>
                        {variant === 'modern' && <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity"><Target size={80} /></div>}
                        <div className={`${s.label} mb-2`}>Active Goals</div>
                        <div className={`text-5xl ${variant === 'sketch' ? 'font-serif font-black' : 'font-black tracking-tight text-gray-900'} mb-4`}>12</div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${variant === 'modern' ? 'bg-emerald-50 text-emerald-700' : 'border border-gray-800'}`}>
                                +2 this week
                            </span>
                            <span className="text-xs text-gray-400">Velocity: High</span>
                        </div>
                        {/* Sketch Decoration */}
                        {variant === 'sketch' && <div className="absolute bottom-2 right-2 w-8 h-8 rounded-full border border-gray-400"></div>}
                    </div>

                    {/* Card 2 */}
                    <div className={`${s.card} p-6`}>
                        <div className={`${s.label} mb-2`}>Completed (Month)</div>
                        <div className={`text-5xl ${variant === 'sketch' ? 'font-serif font-black' : 'font-black tracking-tight text-gray-900'} mb-4`}>8</div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-gray-500">
                                <span>Consistency</span>
                                <span>88%</span>
                            </div>
                            {renderProgressBar(88)}
                        </div>
                    </div>

                    {/* Card 3 */}
                    <div className={`${s.card} p-6`}>
                        <div className={`${s.label} mb-2`}>On Track %</div>
                        <div className={`text-5xl ${variant === 'sketch' ? 'font-serif font-black' : 'font-black tracking-tight text-gray-900'} mb-4`}>75%</div>
                        <div className="flex items-center gap-1 mt-auto">
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`w-1.5 h-4 ${i <= 4 ? 'bg-black' : 'bg-gray-200'} rounded-sm`}></div>
                                ))}
                            </div>
                            <span className="text-xs text-gray-400 ml-2">Focus Index</span>
                        </div>
                    </div>
                </div>

                {/* --- 4. Main Goals List --- */}
                <div className="space-y-6">
                    {MOCK_GOALS.map(goal => (
                        <div
                            key={goal.id}
                            onClick={() => setSelectedGoal(goal)}
                            className={`${s.card} p-0 group cursor-pointer transition-all ${variant === 'modern' ? 'hover:shadow-lg hover:-translate-y-0.5' : 'hover:border-dashed'} relative overflow-hidden`}
                        >
                            {/* Modern Decorative Accent */}
                            {variant === 'modern' && <div className={`absolute top-0 left-0 w-1.5 h-full ${goal.status === 'at-risk' ? 'bg-amber-400' : 'bg-black'}`}></div>}

                            <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                                {/* Left: Info */}
                                <div className="flex-1 space-y-4">
                                    <div className="flex items-center justify-between md:justify-start gap-4 mb-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${variant === 'modern' ? 'bg-gray-100 text-gray-600' : 'border border-gray-600 text-gray-600'
                                            }`}>
                                            {goal.category}
                                        </span>
                                        {goal.linkToOKR && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                <Layout size={10} /> OKR Linked
                                            </span>
                                        )}
                                    </div>

                                    <h3 className={`${s.h1} !text-2xl`}>{goal.title}</h3>

                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={14} /> Due {goal.dueDate}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Activity size={14} /> {goal.priority} Priority
                                        </span>
                                    </div>

                                    {/* Habit Tracking */}
                                    <div className="flex items-center gap-2 pt-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">Habits</span>
                                        <div className="flex gap-1">
                                            {[...Array(7)].map((_, i) => (
                                                <div key={i} className={`w-3 h-3 rounded-sm ${i < goal.habitStreak % 7 ? 'bg-emerald-400' : 'bg-gray-100'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Progress & Stats */}
                                <div className="w-full md:w-64 space-y-5">
                                    <div className="flex justify-between items-end">
                                        <span className={`${s.label} normal-case`}>Progress</span>
                                        <span className="text-xl font-bold font-mono">{goal.progress}%</span>
                                    </div>
                                    {renderProgressBar(goal.progress)}

                                    <div className="space-y-2">
                                        {goal.subGoals.slice(0, 2).map(sg => (
                                            <div key={sg.id} className="flex items-center gap-2 text-sm text-gray-500">
                                                <div className={`w-4 h-4 border rounded-full flex items-center justify-center ${sg.completed ? 'bg-black border-black text-white' : 'border-gray-300'}`}>
                                                    {sg.completed && <CheckCircle2 size={10} />}
                                                </div>
                                                <span className={sg.completed ? 'line-through opacity-50' : ''}>{sg.title}</span>
                                            </div>
                                        ))}
                                        {goal.subGoals.length > 2 && <div className="text-xs text-gray-400 pl-6">+{goal.subGoals.length - 2} more items</div>}
                                    </div>
                                </div>

                                {/* Options */}
                                <button className={`absolute top-6 right-6 p-2 rounded-full ${variant === 'modern' ? 'hover:bg-gray-50 text-gray-300 hover:text-gray-600' : 'text-gray-400'}`}>
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- 5. Right-side Goal Drawer --- */}
                {selectedGoal && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setSelectedGoal(null)}></div>
                        <div className={`relative w-full max-w-md h-full shadow-2xl overflow-y-auto p-8 animate-in slide-in-from-right duration-300 ${s.pageBg} ${variant === 'sketch' ? 'border-l-4 border-gray-800' : ''}`}>
                            <div className="flex justify-between items-start mb-8">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Goal Details</span>
                                <button onClick={() => setSelectedGoal(null)}><X size={24} className="text-gray-400 hover:text-gray-900" /></button>
                            </div>

                            <h2 className={`${s.h1} !text-3xl mb-4 leading-tight`}>{selectedGoal.title}</h2>

                            {/* Metadata Grid */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className={`p-4 ${variant === 'modern' ? 'bg-gray-50 rounded-2xl' : 'border border-gray-300'}`}>
                                    <div className="text-xs text-gray-400 mb-1">Status</div>
                                    <div className="font-bold flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${selectedGoal.status === 'on-track' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                        {selectedGoal.status.replace('-', ' ')}
                                    </div>
                                </div>
                                <div className={`p-4 ${variant === 'modern' ? 'bg-gray-50 rounded-2xl' : 'border border-gray-300'}`}>
                                    <div className="text-xs text-gray-400 mb-1">Due Date</div>
                                    <div className="font-bold">{selectedGoal.dueDate}</div>
                                </div>
                            </div>

                            {/* Matrix Chart (Effort vs Impact) */}
                            <div className="mb-8">
                                <h3 className={`${s.h3} mb-4`}>Effort vs Impact</h3>
                                <div className={`aspect-video rounded-xl relative ${variant === 'modern' ? 'bg-gray-50 border border-gray-100' : 'border-2 border-gray-800'}`}>
                                    {/* Grid Lines */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-full h-px bg-gray-200"></div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-full w-px bg-gray-200"></div>
                                    </div>

                                    {/* Labels */}
                                    <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 uppercase font-bold">High Impact</span>
                                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 uppercase font-bold">Low Impact</span>
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 uppercase font-bold vertical-rl">High Effort</span>
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 uppercase font-bold vertical-rl">Low Effort</span>

                                    {/* The Dot */}
                                    <div className="absolute top-1/4 right-1/4 w-4 h-4 bg-black rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Milestones */}
                            <div className="mb-8">
                                <h3 className={`${s.h3} mb-4`}>Milestones</h3>
                                <div className="space-y-3">
                                    {selectedGoal.subGoals.map(sg => (
                                        <div key={sg.id} className="flex items-start gap-3 group">
                                            <button className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border transition-colors ${sg.completed ? 'bg-black border-black text-white' : 'border-gray-300 hover:border-black'}`}>
                                                {sg.completed && <CheckCircle2 size={12} />}
                                            </button>
                                            <span className={`text-sm ${sg.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{sg.title}</span>
                                        </div>
                                    ))}
                                    <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-black mt-2 font-medium">
                                        <Plus size={14} /> Add Milestone
                                    </button>
                                </div>
                            </div>

                            <button className={`w-full py-4 flex items-center justify-center gap-2 ${s.buttonPrimary}`}>
                                <CheckCircle2 size={18} /> Mark as Completed
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 6. New Goal Modal --- */}
                {showNewGoalModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowNewGoalModal(false)}></div>
                        <div className={`relative w-full max-w-lg p-8 animate-in zoom-in-95 duration-200 ${s.card} ${variant === 'sketch' ? 'bg-white' : ''}`}>
                            <h2 className={`${s.h1} !text-2xl mb-6`}>Create New Goal</h2>

                            <div className="space-y-5">
                                <div>
                                    <label className={`${s.label} block mb-2`}>Goal Title</label>
                                    <input type="text" placeholder="e.g., Launch Q4 Marketing Campaign" className={`w-full px-4 py-3 ${s.input}`} />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`${s.label} block mb-2`}>Category</label>
                                        <select className={`w-full px-4 py-3 appearance-none ${s.input}`}>
                                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`${s.label} block mb-2`}>Due Date</label>
                                        <input type="date" className={`w-full px-4 py-3 ${s.input}`} />
                                    </div>
                                </div>

                                <div>
                                    <label className={`${s.label} block mb-2`}>Priority & Impact</label>
                                    <div className="flex gap-4">
                                        {['Low', 'Medium', 'High'].map(p => (
                                            <button key={p} className={`flex-1 py-2 text-sm font-bold border rounded-lg ${p === 'High' ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-600'}`}>{p}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button className={`flex-1 py-3 ${s.buttonPrimary}`}>Save Goal</button>
                                    <button onClick={() => setShowNewGoalModal(false)} className={`px-6 py-3 ${s.buttonSecondary}`}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// --- Page Wrapper (Side-by-side View) ---
const GoalsPage: React.FC = () => {
    return (
        <div className="flex flex-col xl:flex-row h-screen overflow-hidden">
            {/* Container 1: Modern */}
            <div className="flex-1 overflow-y-auto border-r border-gray-200 bg-white">
                <div className="sticky top-0 z-10 bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-widest text-center shadow-md">
                    Option 1: Modern Minimalist
                </div>
                <GoalsLayout variant="modern" />
            </div>

            {/* Container 2: Pencil Sketch */}
            <div className="flex-1 overflow-y-auto bg-[#fafafa]">
                <div className="sticky top-0 z-10 bg-stone-200 text-stone-800 border-b-2 border-stone-800 px-4 py-2 text-xs font-serif font-bold uppercase tracking-widest text-center shadow-sm">
                    Option 2: Pencil Wireframe
                </div>
                <GoalsLayout variant="sketch" />
            </div>
        </div>
    );
};

export default GoalsPage;
