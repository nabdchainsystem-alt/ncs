import React from 'react';
import { CheckSquare, Grid, Clock, Timer, Columns, List, ArrowRight } from 'lucide-react';

interface SystemCardProps {
    title: string;
    description: string;
    icon: any;
    color: string;
}

const SystemCard: React.FC<SystemCardProps> = ({ title, description, icon: Icon, color }) => (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group cursor-pointer h-full flex flex-col">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-6 h-6 text-gray-700" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed mb-6 flex-1">
            {description}
        </p>
        <div className="flex items-center text-sm font-medium text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-x-2 group-hover:translate-x-0">
            Explore System <ArrowRight className="w-4 h-4 ml-2" />
        </div>
    </div>
);

export const ProductivitySystemsWidget: React.FC = () => {
    const systems = [
        {
            title: "Getting Things Done (GTD)",
            description: "A comprehensive framework for organizing tasks and clearing mental clutter. Based on five steps: Capture, Clarify, Organize, Reflect, and Engage.",
            icon: CheckSquare,
            color: "bg-blue-100",
        },
        {
            title: "Eisenhower Matrix",
            description: "Prioritize tasks by urgency and importance. Divide work into four quadrants: Do First, Schedule, Delegate, and Eliminate.",
            icon: Grid,
            color: "bg-purple-100",
        },
        {
            title: "Time Blocking",
            description: "Dedicate specific blocks of time to focused work. Reduces multitasking and creates structure by scheduling your priorities.",
            icon: Clock,
            color: "bg-green-100",
        },
        {
            title: "Pomodoro Technique",
            description: "Boost focus with timed intervals. Work for 25 minutes, then take a 5-minute break to maintain high mental energy.",
            icon: Timer,
            color: "bg-red-100",
        },
        {
            title: "Kanban Method",
            description: "Visualize your workflow. Move tasks through columns like 'To Do', 'In Progress', and 'Done' to track progress and spot bottlenecks.",
            icon: Columns,
            color: "bg-orange-100",
        },
        {
            title: "Bullet Journal",
            description: "A rapid logging method combining tasks, notes, and events. organized with specific symbols to track your past, present, and future.",
            icon: List,
            color: "bg-yellow-100",
        }
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 px-1">Productivity Systems Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {systems.map((system, index) => (
                    <SystemCard key={index} {...system} />
                ))}
            </div>
        </div>
    );
};
