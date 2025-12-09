import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Thermometer, Zap, Timer, Settings, AlertCircle, Users, Plus, X, ChevronRight, Box, Droplets, Wind, Flame, Layers, Hammer, ArrowRight } from 'lucide-react';

// Machine Unit Components
const MachineUnit = memo(({ type, label, status, speed, temp, isDetailed }: any) => {
    const isWarning = status === 'warning';
    const colorClass = isWarning ? 'text-yellow-500' : 'text-cyan-500';

    const renderMachineVisual = () => {
        switch (type) {
            case 'hopper':
                return (
                    <div className="relative w-32 h-40 flex flex-col items-center justify-end">
                        {/* Hopper Funnel */}
                        <div className="w-24 h-24 relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-16 bg-white/5 border-x-2 border-t-2 border-white/20 skew-x-12 rounded-t-lg" style={{ transform: 'translateX(-50%) perspective(20px) rotateX(5deg)' }}></div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white/10 border-x-2 border-b-2 border-white/20"></div>
                        </div>
                        {/* Pellets Animation */}
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-1 h-16 overflow-hidden">
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                                    animate={{ y: [0, 60], opacity: [1, 0] }}
                                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                />
                            ))}
                        </div>
                    </div>
                );
            case 'injection':
                return (
                    <div className="relative w-56 h-40 flex flex-col items-center justify-end">
                        {/* Barrel and Screw */}
                        <div className="w-48 h-16 border-2 border-white/20 rounded-r-xl relative overflow-hidden bg-white/5 flex items-center">
                            {/* Screw Animation */}
                            <motion.div
                                animate={{ x: [-10, 0, -10] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-[120%] h-8 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"
                            />
                            {/* Heat Zones */}
                            <div className="absolute inset-0 flex justify-around opacity-30">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-full w-8 bg-orange-500/20 blur-md animate-pulse" style={{ animationDelay: `${i * 0.5}s` }} />
                                ))}
                            </div>
                        </div>
                        <div className="w-40 h-8 bg-white/10 mt-1 rounded-b-lg mx-auto" />
                    </div>
                );
            case 'clamping':
                return (
                    <div className="relative w-48 h-48 flex flex-col items-center justify-end">
                        {/* Clamping Unit */}
                        <div className="flex items-center gap-1">
                            {/* Stationary Platen */}
                            <div className="w-4 h-32 bg-white/20 rounded-sm border border-white/30" />

                            {/* Moving Platen */}
                            <motion.div
                                animate={{ x: [0, 20, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="w-4 h-32 bg-white/20 rounded-sm border border-white/30"
                            />

                            {/* Tie Bars */}
                            <div className="absolute top-1/3 left-0 right-0 h-1 bg-white/10 -z-10" />
                            <div className="absolute bottom-1/3 left-0 right-0 h-1 bg-white/10 -z-10" />
                        </div>
                        {/* Hydraulic Cylinder */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-12 bg-white/5 border border-white/10 rounded-r-lg -z-20" />
                    </div>
                );
            case 'mold':
                return (
                    <div className="relative w-40 h-40 flex flex-col items-center justify-end">
                        {/* Mold Halves */}
                        <div className="flex items-center justify-center h-24 relative">
                            <motion.div
                                animate={{ x: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="w-8 h-16 bg-cyan-900/40 border border-cyan-500/30 rounded-l-md"
                            />
                            <div className="w-8 h-16 bg-cyan-900/40 border border-cyan-500/30 rounded-r-md" />

                            {/* Molten Plastic Fill */}
                            <motion.div
                                animate={{ opacity: [0, 1, 0], scale: [0.8, 1, 0.8] }}
                                transition={{ duration: 4, repeat: Infinity, times: [0.4, 0.5, 0.9] }}
                                className="absolute w-6 h-12 bg-orange-500 blur-md rounded-sm z-10"
                            />
                        </div>
                    </div>
                );
            case 'cooling':
                return (
                    <div className="relative w-40 h-40 flex flex-col items-center justify-end">
                        {/* Cooling Lines */}
                        <div className="w-32 h-24 border-2 border-blue-400/20 rounded-xl relative overflow-hidden bg-blue-500/5 p-2 grid grid-cols-4 gap-1">
                            {[...Array(12)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.2, 0.6, 0.2] }}
                                    transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
                                    className="w-full h-full bg-blue-400/20 rounded-full"
                                />
                            ))}
                        </div>
                        <Wind className="absolute -right-4 top-0 text-blue-400/50 w-6 h-6 animate-pulse" />
                    </div>
                );
            case 'ejector':
                return (
                    <div className="relative w-32 h-40 flex flex-col items-center justify-end">
                        {/* Part Drop */}
                        <div className="w-24 h-32 border-x-2 border-white/10 relative">
                            <motion.div
                                animate={{ y: [0, 100], opacity: [0, 1, 0], rotate: [0, 45] }}
                                transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 border-2 border-cyan-500 rounded-md"
                            />
                        </div>
                        <div className="w-32 h-2 bg-white/20 mt-2" />
                    </div>
                );
            case 'robot':
                return (
                    <div className="relative w-40 h-48 flex flex-col items-center justify-end">
                        {/* Robot Arm */}
                        <div className="relative w-full h-full">
                            <motion.div
                                animate={{ rotate: [0, -30, 0], x: [0, -20, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
                                className="absolute bottom-0 right-10 w-2 h-32 bg-white/20 origin-bottom"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-2 bg-white/20" />
                                <div className="absolute top-0 left-0 w-2 h-8 bg-cyan-500/50" />
                            </motion.div>
                        </div>
                    </div>
                );
            default:
                return <div className="w-32 h-32 bg-white/10" />;
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-end h-full group/unit">
            {/* Data Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute bottom-full mb-4 ${isDetailed ? 'w-40' : 'w-32'} bg-[#1a1d24]/90 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-xl z-30`}
            >
                <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{label}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${isWarning ? 'bg-yellow-500 animate-pulse' : 'bg-cyan-500'}`} />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-gray-400">
                    <span>SPD</span><span className="text-right text-white">{speed}</span>
                    <span>TMP</span><span className="text-right text-white">{temp}</span>
                </div>
                {/* Connector Line */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-4 bg-white/20" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/40 rounded-full mt-4" />
            </motion.div>

            {/* Machine Visual */}
            <div className={`relative z-20 transition-all duration-300 ${isWarning ? 'drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]'}`}>
                {renderMachineVisual()}
            </div>
        </div>

    );
});

// Live Temp Component
const LiveTemp = ({ base }: { base: number }) => {
    const [val, setVal] = useState(base);
    useEffect(() => {
        const interval = setInterval(() => {
            setVal(base + Math.floor(Math.random() * 5 - 2));
        }, 500);
        return () => clearInterval(interval);
    }, [base]);
    return <>{val}°C</>;
};

// Live OEE Header Component
const LiveOEE = () => {
    const [oee, setOee] = useState(96.8);
    useEffect(() => {
        const interval = setInterval(() => {
            setOee(prev => Number((96.8 + Math.random() * 0.4 - 0.2).toFixed(1)));
        }, 500);
        return () => clearInterval(interval);
    }, []);
    return (
        <div className="text-right hidden md:block">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">OEE</div>
            <div className="text-2xl font-mono text-cyan-400 font-bold">{oee}%</div>
        </div>
    );
};

// Live Footer Stats Component
const LiveStatsFooter = () => {
    const [stats, setStats] = useState({
        pressure: 1800,
        temp: 280, // Simulation temp for graph/other if needed, but mainly pressure here
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                pressure: 1800 + Math.floor(Math.random() * 50 - 25),
            }));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-20 border-t border-white/10 bg-[#0f1115]/90 backdrop-blur-xl relative overflow-hidden flex flex-col justify-end pb-2 px-12">
            <div className="flex justify-between items-center h-full">
                <div className="flex gap-8">
                    <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider">Injection Pressure</div>
                        <div className="text-lg font-mono text-white flex items-center gap-1">
                            {stats.pressure} <span className="text-xs text-gray-500">bar</span>
                        </div>
                    </div>
                    <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider">Clamp Force</div>
                        <div className="text-lg font-mono text-white">2950 <span className="text-xs text-gray-500">kN</span></div>
                    </div>
                    <div>
                        <div className="text-[9px] text-gray-500 uppercase tracking-wider">Shot Size</div>
                        <div className="text-lg font-mono text-white">450 <span className="text-xs text-gray-500">g</span></div>
                    </div>
                </div>

                {/* Live Graph Simulation */}
                <div className="flex-1 max-w-md h-12 ml-8 flex items-end gap-1 opacity-50 relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent" />
                    {[...Array(40)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{
                                height: [
                                    `${20 + Math.random() * 30}%`,
                                    `${40 + Math.random() * 50}%`,
                                    `${20 + Math.random() * 30}%`
                                ]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.05, ease: "easeInOut" }}
                            className="flex-1 bg-cyan-400/40 rounded-t-sm"
                        />
                    ))}
                    {/* Moving Line Overlay */}
                    <svg className="absolute inset-0 w-full h-full overflow-visible">
                        <motion.path
                            d="M0,40 Q20,10 40,30 T80,30 T120,40"
                            fill="none"
                            stroke="rgba(34,211,238,0.8)"
                            strokeWidth="2"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
};

export const HuskyMachineVisual = () => {
    const [isDetailed, setIsDetailed] = useState(false);

    // Live Data extracted to components
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const sections = [
        { id: 'hopper', type: 'hopper', label: 'Hopper', status: 'optimal', temp: '45°C', speed: '100%' },
        { id: 'injection', type: 'injection', label: 'Injection Unit', status: 'optimal', temp: <LiveTemp base={280} />, speed: '220mm/s' },
        { id: 'clamping', type: 'clamping', label: 'Clamping Unit', status: 'optimal', temp: '45°C', speed: '3500kN' },
        { id: 'mold', type: 'mold', label: 'Mold Cavity', status: 'optimal', temp: '65°C', speed: '12s' },
        { id: 'cooling', type: 'cooling', label: 'Cooling Sys', status: 'optimal', temp: '12°C', speed: '100%' },
        { id: 'ejector', type: 'ejector', label: 'Ejector', status: 'optimal', temp: '45°C', speed: '150mm/s' },
        { id: 'robot', type: 'robot', label: 'Robot Handler', status: 'optimal', temp: '25°C', speed: '2m/s' },
    ];

    const visibleSections = isDetailed ? sections : sections;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative p-4 md:p-8">
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[95%] h-full relative bg-[#0f1115]/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                {/* Header */}
                <div className="relative z-20 p-6 flex justify-between items-start border-b border-white/5 bg-[#0f1115]/50">
                    <div>
                        <h2 className="text-3xl font-black text-white mb-1 flex items-center gap-3 tracking-tight">
                            <Layers className="text-cyan-400 animate-pulse w-6 h-6" />
                            HUSKY HYCOR 300
                        </h2>
                        <div className="flex gap-4 text-xs text-gray-400 font-mono">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> RUNNING</span>
                            <span className="flex items-center gap-1.5"><Timer size={12} /> CYCLE: 12.4s</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <LiveOEE />
                        <button
                            onClick={() => setIsDetailed(!isDetailed)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${isDetailed ? 'bg-white text-black border-white' : 'bg-white/5 border-white/20 text-white hover:bg-white/10'}`}
                        >
                            {isDetailed ? <X size={16} /> : <Plus size={16} />}
                            <span className="font-bold tracking-wide uppercase text-xs">{isDetailed ? 'Close' : 'Details'}</span>
                        </button>
                    </div>
                </div>

                {/* Main Schematic Area */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    <div
                        ref={scrollContainerRef}
                        className={`flex-1 relative flex items-end pb-20 ${isDetailed ? 'overflow-x-auto cursor-grab active:cursor-grabbing' : 'justify-center overflow-hidden'}`}
                    >
                        <div className={`relative flex items-end gap-8 transition-all duration-700 ${isDetailed ? 'min-w-max px-20' : 'w-full justify-center px-10'}`}>

                            {/* Base Platform */}
                            <div className="absolute bottom-0 left-10 right-10 h-8 bg-[#1a1d24] border-t border-white/20 z-10 flex items-center justify-center">
                                <div className="w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,rgba(255,255,255,0.05)_100%)] bg-[size:20px_20px] opacity-20" />
                            </div>

                            {/* Machines */}
                            <AnimatePresence mode='popLayout'>
                                {visibleSections.map((section, idx) => (
                                    <motion.div
                                        layout
                                        key={section.id}
                                        initial={{ opacity: 0, y: 50 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.5, delay: idx * 0.05 }}
                                        className="relative z-20 mb-8 origin-bottom scale-75 md:scale-90"
                                    >
                                        <MachineUnit {...section} isDetailed={isDetailed} />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Timeline / Stats Footer */}
                    <LiveStatsFooter />
                </div>
            </motion.div>
        </div>
    );
};
