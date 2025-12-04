import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Thermometer, Zap, Timer, Settings, AlertCircle, Users, Plus, X, ChevronRight, Box, Droplets, Wind, Flame } from 'lucide-react';

// Machine Unit Components
const MachineUnit = ({ type, label, status, speed, temp, isDetailed }: any) => {
    const isWarning = status === 'warning';
    const colorClass = isWarning ? 'text-yellow-500' : 'text-purple-500';
    const bgClass = isWarning ? 'bg-yellow-500/10' : 'bg-purple-500/10';
    const borderClass = isWarning ? 'border-yellow-500/30' : 'border-purple-500/30';

    const renderMachineVisual = () => {
        switch (type) {
            case 'infeed':
                return (
                    <div className="relative w-32 h-40 flex flex-col items-center justify-end">
                        {/* Funnel Shape */}
                        <div className="w-24 h-24 border-x-2 border-b-2 border-white/20 rounded-b-xl relative overflow-hidden bg-white/5">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5" />
                            {/* Moving parts */}
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 border-2 border-dashed border-white/10 rounded-full"
                            />
                        </div>
                        <div className="w-2 h-16 bg-white/20" />
                    </div>
                );
            case 'heater':
                return (
                    <div className="relative w-48 h-40 flex flex-col items-center justify-end">
                        {/* Heater Tunnel */}
                        <div className="w-full h-24 border-2 border-white/20 rounded-xl relative overflow-hidden bg-white/5 flex items-center justify-center gap-4">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                                    className="w-2 h-16 bg-orange-500/50 blur-sm rounded-full"
                                />
                            ))}
                            <Flame className="absolute top-2 right-2 text-orange-500/50 w-4 h-4" />
                        </div>
                        <div className="w-full h-16 flex justify-between px-4">
                            <div className="w-2 h-full bg-white/20" />
                            <div className="w-2 h-full bg-white/20" />
                        </div>
                    </div>
                );
            case 'blower':
                return (
                    <div className="relative w-40 h-48 flex flex-col items-center justify-end">
                        {/* Mold Press */}
                        <div className="w-32 h-32 border-2 border-white/20 rounded-xl relative overflow-hidden bg-white/5 flex flex-col items-center justify-center">
                            <motion.div
                                animate={{ height: ['0%', '100%', '0%'] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-full bg-white/5 absolute top-0 left-0 right-0 border-b border-white/10"
                            />
                            <Wind className="text-blue-400/50 w-8 h-8" />
                        </div>
                        <div className="w-24 h-16 border-x-2 border-white/20 mx-auto" />
                    </div>
                );
            case 'filler':
                return (
                    <div className="relative w-48 h-56 flex flex-col items-center justify-end">
                        {/* Tank */}
                        <div className="w-40 h-32 border-2 border-white/20 rounded-t-3xl relative overflow-hidden bg-white/5 backdrop-blur-sm">
                            {/* Liquid Level with Wave Animation */}
                            <div className="absolute bottom-0 w-full h-3/4 bg-blue-500/20 overflow-hidden">
                                <motion.div
                                    animate={{ x: ['-50%', '0%'] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                                    className="absolute top-0 left-0 w-[200%] h-4 bg-blue-400/30 rounded-[100%] -translate-y-1/2"
                                    style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
                                />
                                <motion.div
                                    animate={{ x: ['0%', '-50%'] }}
                                    transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                                    className="absolute top-1 left-0 w-[200%] h-4 bg-blue-300/20 rounded-[100%] -translate-y-1/2"
                                    style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
                                />
                            </div>
                            {/* Bubbles */}
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute bottom-0 w-1 h-1 bg-blue-300/40 rounded-full"
                                    style={{ left: `${20 + Math.random() * 60}%` }}
                                    animate={{ y: -100, opacity: [0, 1, 0] }}
                                    transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                                />
                            ))}
                            <Droplets className="absolute top-4 left-1/2 -translate-x-1/2 text-blue-400/80 w-6 h-6 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                        </div>
                        {/* Nozzles */}
                        <div className="w-full h-24 flex justify-around px-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-4 h-full bg-white/10 relative rounded-b-sm overflow-hidden">
                                    <motion.div
                                        animate={{ height: ['0%', '100%'], opacity: [0.8, 0] }}
                                        transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.15, ease: "easeOut" }}
                                        className="w-1 bg-blue-400 absolute top-0 left-1/2 -translate-x-1/2 h-full shadow-[0_0_8px_rgba(96,165,250,0.8)]"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'capper':
                return (
                    <div className="relative w-32 h-48 flex flex-col items-center justify-end">
                        {/* Press Mechanism */}
                        <div className="w-24 h-full border-x-2 border-t-2 border-white/20 rounded-t-xl relative bg-white/5 flex flex-col items-center">
                            <motion.div
                                animate={{ y: [0, 20, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="w-16 h-32 bg-white/10 border border-white/20 rounded-b-lg mt-4"
                            />
                        </div>
                    </div>
                );
            case 'labeler':
                return (
                    <div className="relative w-40 h-40 flex flex-col items-center justify-end">
                        {/* Rollers */}
                        <div className="flex gap-2 items-center justify-center h-24">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-12 h-12 rounded-full border-2 border-dashed border-white/30"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 rounded-full border-2 border-dashed border-white/30"
                            />
                        </div>
                        <div className="w-32 h-16 border-x-2 border-t-2 border-white/20 rounded-t-lg" />
                    </div>
                );
            case 'packer':
                return (
                    <div className="relative w-48 h-48 flex flex-col items-center justify-end">
                        {/* Grid Arm */}
                        <div className="w-40 h-32 border-2 border-white/20 rounded-xl relative overflow-hidden bg-white/5 flex items-center justify-center">
                            <Box className="text-white/30 w-10 h-10" />
                            <motion.div
                                animate={{ x: [-20, 20, -20] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute inset-0 border-r border-white/10"
                            />
                        </div>
                        <div className="w-full h-16 flex justify-between px-8">
                            <div className="w-2 h-full bg-white/20" />
                            <div className="w-2 h-full bg-white/20" />
                        </div>
                    </div>
                );
            default:
                return <div className="w-32 h-32 bg-white/10" />;
        }
    };

    return (
        <div className="relative flex flex-col items-center justify-end h-full group/unit">
            {/* Data Card - Connected to Machine */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`absolute bottom-full mb-4 ${isDetailed ? 'w-40' : 'w-32'} bg-[#1a1d24]/90 backdrop-blur-xl border border-white/10 rounded-lg p-3 shadow-xl z-30`}
            >
                <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-1">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">{label}</span>
                    <div className={`w-1.5 h-1.5 rounded-full ${isWarning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
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
            <div className={`relative z-20 transition-all duration-300 ${isWarning ? 'drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'drop-shadow-[0_0_15px_rgba(168,85,247,0.3)]'}`}>
                {renderMachineVisual()}
            </div>
        </div>
    );
};

export const KronesMachineVisual = () => {
    const [isDetailed, setIsDetailed] = useState(false);
    const [timePosition, setTimePosition] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const minutes = now.getHours() * 60 + now.getMinutes();
            const percentage = (minutes / 1440) * 100;
            setTimePosition(percentage);
        };
        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    const sections = [
        { id: 'infeed', type: 'infeed', label: 'Infeed', status: 'optimal', temp: '22°C', speed: '45k' },
        { id: 'heater', type: 'heater', label: 'Heater', status: 'optimal', temp: '110°C', speed: '45k' },
        { id: 'blower', type: 'blower', label: 'Blower', status: 'optimal', temp: '95°C', speed: '45k' },
        { id: 'filler', type: 'filler', label: 'Filler', status: 'warning', temp: '4°C', speed: '44.5k' },
        { id: 'capper', type: 'capper', label: 'Capper', status: 'optimal', temp: '23°C', speed: '45k' },
        { id: 'labeler', type: 'labeler', label: 'Labeler', status: 'optimal', temp: '24°C', speed: '45k' },
        { id: 'packer', type: 'packer', label: 'Packer', status: 'optimal', temp: '22°C', speed: '45k' },
    ];

    const visibleSections = isDetailed ? sections : sections.filter((_, i) => [0, 3, 4, 5, 6].includes(i));

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative p-4 md:p-8">
            <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[95%] h-[85vh] relative bg-[#0f1115]/90 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

                {/* Header */}
                <div className="relative z-20 p-6 flex justify-between items-start border-b border-white/5 bg-[#0f1115]/50">
                    <div>
                        <h2 className="text-3xl font-black text-white mb-1 flex items-center gap-3 tracking-tight">
                            <Settings className="text-purple-400 animate-spin-slow w-6 h-6" />
                            KRONES MODULFIL 101
                        </h2>
                        <div className="flex gap-4 text-xs text-gray-400 font-mono">
                            <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> ONLINE</span>
                            <span className="flex items-center gap-1.5"><Timer size={12} /> 14:22:05</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Efficiency</div>
                            <div className="text-2xl font-mono text-green-400 font-bold">94.2%</div>
                        </div>
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
                        <div className={`relative flex items-end gap-4 transition-all duration-700 ${isDetailed ? 'min-w-max px-20' : 'w-full justify-around px-10'}`}>

                            {/* Conveyor Belt Track */}
                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#1a1d24] border-t border-white/20 z-10 flex items-center overflow-hidden">
                                {/* Moving Belt Texture */}
                                <motion.div
                                    className="absolute inset-0 flex"
                                    animate={{ x: ['0%', '-50%'] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    {[...Array(50)].map((_, i) => (
                                        <div key={i} className="w-10 h-full border-r border-white/5 skew-x-12" />
                                    ))}
                                </motion.div>

                                {/* Moving Bottles */}
                                <div className="absolute inset-0 flex items-center">
                                    {[...Array(20)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="absolute bottom-2 w-3 h-8 bg-blue-400/20 border border-blue-400/50 rounded-sm backdrop-blur-sm"
                                            initial={{ left: '-5%' }}
                                            animate={{ left: '105%' }}
                                            transition={{
                                                duration: 8,
                                                repeat: Infinity,
                                                ease: "linear",
                                                delay: i * 0.4
                                            }}
                                        />
                                    ))}
                                </div>
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
                                        className="relative z-20 mb-12" // mb-12 to sit on top of conveyor
                                    >
                                        <MachineUnit {...section} isDetailed={isDetailed} />
                                    </motion.div>
                                ))}

                                {/* Timeline */}
                                <div className="h-40 border-t border-white/10 bg-[#0f1115]/90 backdrop-blur-xl relative overflow-hidden flex flex-col justify-end pb-4 px-12">
                                    {/* Time Labels */}
                                    <div className="flex justify-between items-end mb-2 text-[10px] font-mono text-gray-500 px-2 uppercase tracking-widest">
                                        <span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>24:00</span>
                                    </div>

                                    {/* Main Track */}
                                    <div className="relative h-16 w-full bg-white/5 rounded-lg border border-white/10 overflow-hidden flex items-center shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
                                        {/* Grid Lines */}
                                        <div className="absolute inset-0 flex justify-between px-4 opacity-20">
                                            {[...Array(25)].map((_, i) => (
                                                <div key={i} className={`h-full w-px ${i % 4 === 0 ? 'bg-white/50' : 'bg-white/20'}`} />
                                            ))}
                                        </div>

                                        {/* Data Visualization (Holographic Waves) */}
                                        <div className="absolute inset-0 flex items-end px-4 gap-0.5 opacity-60">
                                            {[...Array(120)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ height: '10%' }}
                                                    animate={{
                                                        height: [`${10 + Math.random() * 30}%`, `${10 + Math.random() * 60}%`, `${10 + Math.random() * 30}%`],
                                                        opacity: [0.2, 0.5, 0.2]
                                                    }}
                                                    transition={{ duration: 3 + Math.random() * 2, repeat: Infinity }}
                                                    className="flex-1 bg-gradient-to-t from-purple-500/50 to-transparent rounded-t-sm"
                                                />
                                            ))}
                                        </div>

                                        {/* Breakdown Event 1 */}
                                        <div className="absolute left-[15%] h-full flex flex-col items-center justify-center group/event z-20">
                                            {/* Holographic Arrow & Label */}
                                            <div className="absolute bottom-full mb-2 flex flex-col items-center opacity-80 hover:opacity-100 transition-opacity">
                                                <div className="bg-red-500/10 border border-red-500/50 px-3 py-1.5 rounded backdrop-blur-md flex flex-col items-center shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                                                    <span className="text-[9px] font-bold text-red-400 tracking-wider whitespace-nowrap">MOTOR STALL</span>
                                                    <span className="text-[8px] text-red-300/70 font-mono">03:45 - 04:15</span>
                                                </div>
                                                <div className="w-px h-4 bg-gradient-to-b from-red-500/50 to-transparent" />
                                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-red-500/50" />
                                            </div>
                                            {/* Zone on Track */}
                                            <div className="w-12 h-full bg-red-500/10 border-x border-red-500/30 animate-pulse" />
                                        </div>

                                        {/* Breakdown Event 2 */}
                                        <div className="absolute left-[68%] h-full flex flex-col items-center justify-center group/event z-20">
                                            {/* Holographic Arrow & Label */}
                                            <div className="absolute bottom-full mb-2 flex flex-col items-center opacity-80 hover:opacity-100 transition-opacity">
                                                <div className="bg-orange-500/10 border border-orange-500/50 px-3 py-1.5 rounded backdrop-blur-md flex flex-col items-center shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                                    <span className="text-[9px] font-bold text-orange-400 tracking-wider whitespace-nowrap">TEMP WARNING</span>
                                                    <span className="text-[8px] text-orange-300/70 font-mono">16:20 - 16:45</span>
                                                </div>
                                                <div className="w-px h-4 bg-gradient-to-b from-orange-500/50 to-transparent" />
                                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-orange-500/50" />
                                            </div>
                                            {/* Zone on Track */}
                                            <div className="w-8 h-full bg-orange-500/10 border-x border-orange-500/30 animate-pulse" />
                                        </div>

                                        {/* Real-time Cursor */}
                                        <motion.div
                                            className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)] z-30"
                                            style={{ left: `${timePosition}%` }}
                                        >
                                            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                                <div className="bg-white/10 backdrop-blur-md border border-white/30 px-2 py-1 rounded shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                                    <span className="text-[10px] font-mono font-bold text-white tracking-widest">
                                                        {new Date().toLocaleTimeString('en-US', { hour12: false })}
                                                    </span>
                                                </div>
                                                <div className="w-px h-2 bg-white/50" />
                                            </div>
                                            <div className="absolute top-0 w-full h-full bg-gradient-to-b from-white via-transparent to-white opacity-50" />
                                        </motion.div>
                                    </div>
                                </div>
                        </div>
                    </motion.div>
                </div>
                );
};
