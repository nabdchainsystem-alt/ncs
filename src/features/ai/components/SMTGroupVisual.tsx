import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Thermometer, Zap, Timer, Settings, AlertCircle, Users, Plus, X, Server, Cpu, Box, Flame, ArrowRight, Layers } from 'lucide-react';

// SMT Machine Unit Component
const MachineUnit = memo(({ type, label, status, efficiency, speed, isDetailed }: any) => {
    const isWarning = status === 'warning';
    const isStopped = status === 'stopped';
    const colorClass = isWarning ? 'text-yellow-500' : isStopped ? 'text-red-500' : 'text-emerald-500';

    // Color definitions for animations
    const mainColor = isWarning ? 'rgba(234,179,8,0.5)' : isStopped ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)';
    const glowColor = isWarning ? 'rgba(234,179,8,0.2)' : isStopped ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)';

    const renderMachineVisual = () => {
        switch (type) {
            case 'printer':
                return (
                    <div className="relative w-32 h-40 flex flex-col items-center justify-end">
                        {/* Solder Paste Printer */}
                        <div className="w-28 h-24 border-2 border-white/20 rounded-lg relative overflow-hidden bg-white/5 flex flex-col items-center">
                            {/* Moving Squeegee */}
                            <motion.div
                                animate={{ x: [-20, 20, -20] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute top-4 w-16 h-1 bg-white/40"
                            >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-8 bg-white/30" />
                            </motion.div>

                            {/* PCB Board underneath */}
                            <div className="absolute bottom-4 w-20 h-2 bg-emerald-500/20 border border-emerald-500/40 rounded-sm" />
                        </div>
                        {/* Status Light */}
                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${status === 'running' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    </div>
                );
            case 'spi': // Solder Paste Inspection
                return (
                    <div className="relative w-24 h-40 flex flex-col items-center justify-end">
                        <div className="w-20 h-20 border-2 border-white/20 rounded-lg relative overflow-hidden bg-white/5 flex items-center justify-center">
                            {/* Scanning Laser */}
                            <motion.div
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="absolute left-0 right-0 h-0.5 bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                            />
                            <div className="w-12 h-12 border border-white/10 bg-emerald-500/10" />
                        </div>
                    </div>
                );
            case 'mounter':
                return (
                    <div className="relative w-48 h-40 flex flex-col items-center justify-end">
                        {/* Pick and Place Head */}
                        <div className="w-40 h-32 border-x-2 border-t-2 border-white/20 rounded-t-xl relative overflow-hidden bg-white/5">
                            {/* Gantry X-Axis */}
                            <motion.div
                                animate={{ x: [-30, 30, -10, 20, 0] }}
                                transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.6, 0.8, 1] }}
                                className="absolute top-4 left-1/2 -translate-x-1/2 w-8 h-20 bg-white/10 border border-white/20 flex flex-col items-center"
                            >
                                {/* Nozzle Z-Axis */}
                                <motion.div
                                    animate={{ height: [10, 20, 10] }}
                                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.5 }}
                                    className="w-1 bg-white/50 h-4 mt-auto mb-1"
                                />
                                <div className="w-2 h-2 bg-purple-500/50 rounded-full" />
                            </motion.div>

                            {/* Feeder Banks */}
                            <div className="absolute bottom-0 left-2 w-8 h-12 bg-white/10 skew-x-12 border-r border-white/10" />
                            <div className="absolute bottom-0 right-2 w-8 h-12 bg-white/10 -skew-x-12 border-l border-white/10" />
                        </div>
                    </div>
                );
            case 'oven':
                return (
                    <div className="relative w-56 h-40 flex flex-col items-center justify-end">
                        {/* Reflow Oven Tunnel */}
                        <div className="w-48 h-24 border-2 border-white/20 rounded-lg relative overflow-hidden bg-white/5 flex items-center justify-center gap-4">
                            {/* Heat Zones */}
                            {[1, 2, 3, 4].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ height: ['40%', '80%', '40%'], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}
                                    className="w-8 bg-gradient-to-t from-orange-500/40 to-transparent rounded-t-full bottom-0 absolute"
                                    style={{ left: `${20 + (i - 1) * 20}%` }}
                                />
                            ))}
                            {/* Temperature Readout Effect */}
                            <div className="absolute top-2 right-2 text-[8px] font-mono text-orange-400">245°C</div>
                        </div>
                    </div>
                );
            case 'aoi': // Auto Optical Inspection
                return (
                    <div className="relative w-28 h-40 flex flex-col items-center justify-end">
                        <div className="w-24 h-24 border-2 border-white/20 rounded-lg relative overflow-hidden bg-white/5 flex items-center justify-center">
                            {/* Camera Lens */}
                            <div className="w-12 h-12 rounded-full border-4 border-white/10 flex items-center justify-center relative">
                                <motion.div
                                    animate={{ scale: [1, 0.9, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400/50"
                                />
                                <div className="absolute inset-0 border-t-2 border-blue-400/50 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
                            </div>
                            {/* Flash Effect */}
                            <motion.div
                                animate={{ opacity: [0, 0, 0.8, 0] }}
                                transition={{ duration: 2, repeat: Infinity, times: [0, 0.8, 0.85, 1] }}
                                className="absolute inset-0 bg-white/20"
                            />
                        </div>
                    </div>
                );
            default:
                return <div className="w-32 h-32 bg-white/10" />;
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-end h-full group/unit px-2">
            {/* Data Card */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute bottom-full mb-4 ${isDetailed ? 'w-32' : 'w-28'} bg-[#1a1d24]/90 backdrop-blur-xl border border-white/10 rounded-lg p-2 shadow-xl z-30`}
            >
                <div className="flex justify-between items-center mb-1 border-b border-white/10 pb-1">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate">{label}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${status === 'running' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </div>
                <div className="flex flex-col gap-0.5 text-[9px] font-mono text-gray-400">
                    <div className="flex justify-between">
                        <span>EFF</span>
                        <span className={colorClass}>{efficiency}%</span>
                    </div>
                    {(speed || type === 'oven') && (
                        <div className="flex justify-between">
                            <span>{type === 'oven' ? 'TMP' : 'SPD'}</span>
                            <span className="text-white">{speed}</span>
                        </div>
                    )}
                </div>
                {/* Connector Line */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-4 bg-white/20" />
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white/40 rounded-full mt-4" />
            </motion.div>

            {/* Machine Visual */}
            <div className={`relative z-20 transition-all duration-300 drop-shadow-[0_0_15px_${glowColor}]`}>
                {renderMachineVisual()}
            </div>
        </div>
    );
});

// Extracted Stats Footer Component to isolate animations/updates
const StatsFooter = ({ activeLine, isLineStopped }: { activeLine: 'A' | 'B' | 'C', isLineStopped: boolean }) => {
    const [stats, setStats] = useState({
        output: 0,
        yield: 0,
        oee: 0
    });

    // Animate stats when line changes
    useEffect(() => {
        const targetOutput = activeLine === 'C' ? 0 : activeLine === 'B' ? 38500 : 43240;
        const targetYield = activeLine === 'C' ? 0 : activeLine === 'B' ? 98.5 : 99.8;
        const targetOEE = activeLine === 'C' ? 0 : activeLine === 'B' ? 82.4 : 96.2;

        let startTime: number;
        const duration = 1000;

        const animate = (time: number) => {
            if (!startTime) startTime = time;
            const progress = Math.min((time - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out

            setStats({
                output: Math.floor(targetOutput * ease),
                yield: Number((targetYield * ease).toFixed(1)),
                oee: Number((targetOEE * ease).toFixed(1))
            });

            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [activeLine]);

    return (
        <div className="h-24 mx-8 mt-auto border-t border-white/10 grid grid-cols-4 gap-4 py-4">
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 flex flex-col justify-between">
                <div className="text-[10px] text-gray-500 uppercase">Target Output</div>
                <div className="text-xl font-bold text-white">45,000 <span className="text-xs text-gray-500 font-normal">CPH</span></div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="text-[10px] text-gray-500 uppercase">Actual Output</div>
                    <div className={`text-xl font-bold ${isLineStopped ? 'text-red-400' : 'text-emerald-400'}`}>
                        {stats.output.toLocaleString()} <span className="text-xs text-gray-500 font-normal">CPH</span>
                    </div>
                </div>
                {/* Animated Chart Background */}
                <div className="absolute bottom-0 right-0 left-0 h-8 flex items-end gap-1 px-2 opacity-20">
                    {[...Array(10)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ height: isLineStopped ? '5%' : ['20%', '60%', '30%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.08 }}
                            className={`flex-1 rounded-t-sm ${isLineStopped ? 'bg-red-500' : 'bg-emerald-500'}`}
                        />
                    ))}
                </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                <div>
                    <div className="text-[10px] text-gray-500 uppercase">Quality Yield</div>
                    <div className="text-xl font-bold text-blue-400">{stats.yield}%</div>
                </div>
                <div className="relative w-10 h-10">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                        <path className="text-gray-700" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                        <motion.path
                            className="text-blue-500"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray={`${stats.yield}, 100`}
                        />
                    </svg>
                </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/5 flex flex-col justify-between">
                <div className="text-[10px] text-gray-500 uppercase">Next Changeover</div>
                <div className="text-xl font-bold text-white flex items-center gap-2">
                    <Timer size={16} className="text-gray-400" />
                    02:45:00
                </div>
            </div>
        </div>
    );
};

// OEE Header Component
const StatsHeader = ({ activeLine }: { activeLine: 'A' | 'B' | 'C' }) => {
    // Basic lookup to avoid prop drilling complex stats if not needed for immediate update, 
    // but here we just want the OEE to match the footer. 
    // Simplest is to just replicate the number or move stats context up.
    // For now, let's keep it simple: The header OEE is also animated or static from props?
    // The original code had stats state in parent affecting both header and footer.
    // To isolate, we can put the OEE logic here or in a shared context. 
    // Given the structure, duplicating the small calc or making a context is fine. 
    // Let's make a precise isolated component that calculates its own OEE based on activeLine same as footer.

    const [oee, setOee] = useState(0);

    useEffect(() => {
        const targetOEE = activeLine === 'C' ? 0 : activeLine === 'B' ? 82.4 : 96.2;
        let startTime: number;
        const duration = 1000;
        const animate = (time: number) => {
            if (!startTime) startTime = time;
            const progress = Math.min((time - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setOee(Number((targetOEE * ease).toFixed(1)));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [activeLine]);

    return (
        <div className="text-right hidden md:block">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">LINE {activeLine} OEE</div>
            <div className={`text-2xl font-mono font-bold ${activeLine === 'C' ? 'text-red-500' : activeLine === 'B' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {oee}%
            </div>
        </div>
    );
};

export const SMTGroupVisual = () => {
    const [isDetailed, setIsDetailed] = useState(false);
    const [activeLine, setActiveLine] = useState<'A' | 'B' | 'C'>('A');

    // Mock data for different lines
    const lineData = {
        A: [
            { id: 'l1-p', type: 'printer', label: 'DEK NeoHorizon', status: 'running', efficiency: 98, speed: '12s' },
            { id: 'l1-s', type: 'spi', label: 'Koh Young KY8030', status: 'running', efficiency: 99, speed: '100%' },
            { id: 'l1-m1', type: 'mounter', label: 'ASM  SIPLACE SX', status: 'running', efficiency: 96, speed: '60k' },
            { id: 'l1-m2', type: 'mounter', label: 'ASM SIPLACE SX', status: 'running', efficiency: 97, speed: '55k' },
            { id: 'l1-o', type: 'oven', label: 'Heller 1809 MK5', status: 'running', efficiency: 99, speed: '245°C' },
            { id: 'l1-a', type: 'aoi', label: 'Koh Young Zenith', status: 'running', efficiency: 98, speed: '15s' },
        ],
        B: [
            { id: 'l2-p', type: 'printer', label: 'MPM Edison', status: 'running', efficiency: 95, speed: '14s' },
            { id: 'l2-s', type: 'spi', label: 'Parmi SIGMAX', status: 'warning', efficiency: 88, speed: '92%' },
            { id: 'l2-m1', type: 'mounter', label: 'Fuji NXT III', status: 'running', efficiency: 92, speed: '70k' },
            { id: 'l2-m2', type: 'mounter', label: 'Fuji NXT III', status: 'running', efficiency: 94, speed: '68k' },
            { id: 'l2-o', type: 'oven', label: 'Rehm V8', status: 'running', efficiency: 98, speed: '240°C' },
            { id: 'l2-a', type: 'aoi', label: 'Saki 3Di', status: 'running', efficiency: 99, speed: '14s' },
        ],
        C: [
            { id: 'l3-p', type: 'printer', label: 'GKG G9', status: 'stopped', efficiency: 0, speed: '0s' },
            { id: 'l3-s', type: 'spi', label: 'Sinic-Tek', status: 'stopped', efficiency: 0, speed: '0%' },
            { id: 'l3-m1', type: 'mounter', label: 'Yamaha YSM20', status: 'stopped', efficiency: 0, speed: '0k' },
            { id: 'l3-m2', type: 'mounter', label: 'Yamaha YSM20', status: 'stopped', efficiency: 0, speed: '0k' },
            { id: 'l3-o', type: 'oven', label: 'Heller 1809', status: 'stopped', efficiency: 0, speed: '25°C' },
            { id: 'l3-a', type: 'aoi', label: 'Mirtec MV-6', status: 'stopped', efficiency: 0, speed: '0s' },
        ]
    };
    const currentLine = lineData[activeLine];
    const isLineStopped = activeLine === 'C'; // Line C is mock stopped

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
                        <h2 className="text-3xl font-black text-white mb-2 flex items-center gap-3 tracking-tight">
                            <Cpu className="text-emerald-400 w-8 h-8" />
                            SMT PRODUCTION GROUP
                        </h2>

                        {/* Line Selector Pills */}
                        <div className="flex gap-2 mt-2">
                            {(['A', 'B', 'C'] as const).map((line) => (
                                <button
                                    key={line}
                                    onClick={() => setActiveLine(line)}
                                    className={`px-4 py-1 rounded-full text-xs font-bold transition-all border ${activeLine === line
                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    LINE {line}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <StatsHeader activeLine={activeLine} />
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
                <div className="flex-1 relative overflow-hidden flex flex-col justify-end pb-8">

                    {/* Machine Layout */}
                    <div className={`relative flex items-end justify-center transition-all duration-700 h-[60%] ${isDetailed ? 'gap-12 px-10 overflow-x-auto justify-start' : 'gap-4 w-full justify-around px-8'}`}>

                        {/* Conveyor Track */}
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#1a1d24] border-t border-white/20 z-10 flex items-center overflow-hidden">
                            {/* Moving Belt Texture */}
                            <motion.div
                                className="absolute inset-0 flex"
                                animate={{ x: isLineStopped ? '0%' : ['0%', '-50%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                {[...Array(50)].map((_, i) => (
                                    <div key={i} className="w-10 h-full border-r border-white/5 skew-x-12" />
                                ))}
                            </motion.div>

                            {/* Moving PCBs */}
                            {!isLineStopped && (
                                <div className="absolute inset-0 flex items-center">
                                    {[...Array(15)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute bottom-1 w-8 h-2 bg-emerald-500/80 rounded-sm shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            initial={{ left: '-5%' }}
                                            animate={{ left: '105%' }}
                                            transition={{
                                                duration: 10,
                                                repeat: Infinity,
                                                ease: "linear",
                                                delay: i * 0.8
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Machines */}
                        <AnimatePresence mode='popLayout'>
                            {currentLine.map((machine, idx) => (
                                <motion.div
                                    layout
                                    key={`${activeLine}-${machine.id}`}
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                                    className="relative z-20 mb-4 origin-bottom"
                                >
                                    <MachineUnit {...machine} isDetailed={isDetailed} />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Stats Footer */}
                    <StatsFooter activeLine={activeLine} isLineStopped={isLineStopped} />

                </div>
            </motion.div>
        </div>
    );
};
