import React, { useState } from 'react';
import {
    Calendar as CalendarIcon,
    CheckCircle2,
    Clock,
    Plus,
    MoreHorizontal,
    Search,
    Bell,
    Menu,
    ChevronRight,
    ArrowRight,
    Play,
    Circle,
    Square
} from 'lucide-react';
import { Status } from '../../../types/shared';

// --- Types ---

interface OverviewDashboardProps {
    tasks: any[];
    reminders: any[];
    events: any[];
    greeting: string;
    userName: string;
}

// --- Components ---

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
    tasks,
    reminders,
    events,
    greeting,
    userName
}) => {
    const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');

    return (
        <div className="flex flex-col flex-1 overflow-auto bg-stone-50 text-stone-900 font-serif tracking-wide relative">
            {/* Background Texture from Goals Page */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(#000 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}>
            </div>

            <div className="w-full px-8 md:px-16 min-h-screen relative z-10">

                {/* --- Header & Controls --- */}
                <header className="py-10 pt-20 pb-16 flex flex-col md:flex-row justify-between items-end gap-8">
                    <div>
                        <h1 className="text-5xl font-medium tracking-tight text-stone-900 font-serif">Overview</h1>
                        <p className="text-lg text-stone-500 font-serif italic mt-2">Your daily command center.</p>
                    </div>

                    {/* Date Display (Decorative) */}
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Today</p>
                        <p className="text-2xl font-serif italic text-stone-800">
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </header>

                {/* --- Under Construction --- */}
                <div className="flex flex-col items-center justify-center h-[60vh] text-center">
                    <div className="p-8 bg-white rounded-full shadow-sm border border-stone-100 mb-8">
                        <span className="text-6xl">🚧</span>
                    </div>
                    <h2 className="text-4xl font-serif italic text-stone-900 mb-4">Under Construction</h2>
                    <p className="text-stone-500 max-w-md mx-auto text-lg">
                        We are currently building this dashboard to bring you the best overview experience. Check back soon.
                    </p>
                </div>

            </div>
        </div>
    );
};

// --- Sub-components ---

const ActionableTaskRow = ({ task }: any) => {
    const [checked, setChecked] = useState(false);

    return (
        <div className={`
            flex items-center space-x-4 p-4 rounded-xl cursor-pointer group transition-all border border-transparent
            ${checked ? 'opacity-40 bg-stone-50' : 'hover:bg-white hover:border-stone-100 hover:shadow-sm'}
        `}
            onClick={() => setChecked(!checked)}
        >
            {/* Checkbox */}
            <div className={`
                w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                ${checked
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'border-stone-200 group-hover:border-emerald-400 bg-white'}
             `}>
                {checked && <CheckCircle2 size={14} />}
            </div>

            <div className="flex-1">
                <p className={`text-lg transition-colors font-serif ${checked ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                    {task.title}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                    {task.priority === 'high' && !checked && (
                        <span className="text-[9px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">High Priority</span>
                    )}
                    <span className="text-xs text-stone-400 italic">
                        {task.dueTime || 'Today'}
                    </span>
                </div>
            </div>
        </div>
    );
};
