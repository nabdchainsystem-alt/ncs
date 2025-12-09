import React from 'react';
import { Activity, BarChart2, Cpu, Database, Layers, Lock, Server, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface StaticVisualPlaceholderProps {
    type: 'krones' | 'husky' | 'smt' | 'dashboard' | 'tasks' | 'procurement' | string;
    label: string;
    onActivate: () => void;
}

export const StaticVisualPlaceholder: React.FC<StaticVisualPlaceholderProps> = ({ type, label, onActivate }) => {

    // Icon mapping based on type
    const getIcon = () => {
        if (type.includes('krones')) return <Activity size={64} className="text-emerald-500" />;
        if (type.includes('husky')) return <Layers size={64} className="text-cyan-500" />;
        if (type.includes('smt')) return <Cpu size={64} className="text-purple-500" />;
        if (type.includes('dashboard')) return <BarChart2 size={64} className="text-blue-500" />;
        if (type.includes('procurement')) return <Database size={64} className="text-orange-500" />;
        if (type.includes('tasks')) return <Server size={64} className="text-pink-500" />;
        return <Zap size={64} className="text-gray-500" />;
    };

    const getColor = () => {
        if (type.includes('krones')) return 'from-emerald-500/20 to-emerald-900/10 border-emerald-500/30';
        if (type.includes('husky')) return 'from-cyan-500/20 to-cyan-900/10 border-cyan-500/30';
        if (type.includes('smt')) return 'from-purple-500/20 to-purple-900/10 border-purple-500/30';
        if (type.includes('dashboard')) return 'from-blue-500/20 to-blue-900/10 border-blue-500/30';
        if (type.includes('procurement')) return 'from-orange-500/20 to-orange-900/10 border-orange-500/30';
        return 'from-gray-500/20 to-gray-900/10 border-gray-500/30';
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative p-8">
            {/* Schematic Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className={`relative w-full max-w-4xl aspect-video bg-gradient-to-br ${getColor()} backdrop-blur-md rounded-3xl border flex flex-col items-center justify-center text-center p-12 overflow-hidden group`}
            >
                <div className="absolute inset-0 bg-grid-white/5 mask-radial-faded" />

                {/* Center Icon */}
                <div className="mb-8 p-8 bg-black/40 rounded-full border border-white/10 shadow-2xl relative z-10">
                    {getIcon()}
                </div>

                <h2 className="text-4xl font-black text-white mb-4 tracking-tight relative z-10">{label}</h2>
                <div className="flex items-center gap-3 text-gray-400 font-mono text-sm mb-12 relative z-10">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    SYSTEM ONLINE
                    <span className="mx-2 text-gray-700">|</span>
                    <span>STATIC MODE</span>
                </div>

                <button
                    onClick={onActivate}
                    className="group relative px-8 py-3 bg-white text-black font-bold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-all active:scale-95 z-10 flex items-center gap-2"
                >
                    <Zap size={18} className="text-yellow-600 fill-yellow-600" />
                    Activate Live Twin
                </button>

                {/* Decorative Elements */}
                <div className="absolute top-8 left-8 text-xs font-mono text-white/20">ID: {type.toUpperCase()}</div>
                <div className="absolute bottom-8 right-8 text-xs font-mono text-white/20">V 2.5.0</div>
            </motion.div>
        </div>
    );
};
