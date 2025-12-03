import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Atom, Globe, Layout, Network, Sparkles, Layers, Activity } from 'lucide-react';

interface SharedLayoutProps {
    children: ReactNode;
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

const tabs = [
    { id: 'galaxy', label: 'Global Industries Galaxy', icon: Globe },
    { id: 'departments', label: 'Industry → Departments', icon: Layers },
    { id: 'dependencies', label: 'Dependencies Flow', icon: Network },
    { id: 'readiness', label: 'NABD Coverage', icon: Activity },
    { id: 'scenarios', label: 'AI Scenarios', icon: Sparkles },
];

export const SharedLayout: React.FC<SharedLayoutProps> = ({ children, activeTab, onTabChange }) => {
    return (
        <div className="min-h-screen bg-[#050510] text-white font-sans overflow-hidden relative selection:bg-cyan-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1a1a3a] via-[#050510] to-[#000000]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse delay-1000" />
                </div>
                {/* Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            {/* Top Bar */}
            <div className="relative z-50 border-b border-white/10 bg-[#050510]/80 backdrop-blur-md">
                <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative group cursor-pointer">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200" />
                            <div className="relative flex items-center justify-center w-10 h-10 bg-black rounded-full border border-white/10">
                                <Atom className="w-6 h-6 text-cyan-400 animate-spin-slow" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                                NABD <span className="text-cyan-400">GLOBAL BRAIN</span>
                            </h1>
                            <div className="flex items-center gap-2 text-[10px] text-cyan-500/80 font-mono tracking-[0.2em] uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                                Live Intelligence Map v9.0
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className={`
                                        relative px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-300
                                        ${isActive ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-white/10 rounded-lg border border-white/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : ''}`} />
                                    <span className="relative z-10">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-500/20 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-xs font-mono text-cyan-300">SYSTEM ONLINE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-10 h-[calc(100vh-64px)] overflow-hidden">
                {children}
            </div>
        </div>
    );
};
