import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Command, ArrowLeft, BarChart2, Database, PieChart, Activity, TrendingUp, DollarSign, Users } from 'lucide-react';
import { NexusBackground } from '../../ui/NexusBackground';
import { useNavigation } from '../../contexts/NavigationContext';
import { KronesMachineVisual } from './components/KronesMachineVisual';

const VisionPage = () => {
    const { setActivePage } = useNavigation();
    const [viewState, setViewState] = useState<'initial' | 'dashboard'>('initial');
    const [inputValue, setInputValue] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [selectedVisual, setSelectedVisual] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const options = [
        { id: 'grap-machine-krones-101', label: 'Grap Machine Krones 101', icon: BarChart2 },
        { id: 'grap-machine-krones-102', label: 'Grap Machine Krones 102', icon: TrendingUp },
        { id: 'grap-production-lines', label: 'Grap Production Lines', icon: Activity },
        { id: 'graph-dashboard', label: 'Graph Dashboard', icon: BarChart2 },
        { id: 'procurement-analytics', label: 'Open Procurement - Analytics', icon: PieChart },
        { id: 'procurement-data', label: 'Open Procurement - Data', icon: Database },
    ].sort((a, b) => a.label.localeCompare(b.label));

    // Filter options based on input
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(inputValue.toLowerCase().replace('/', '').trim())
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === '/') {
            e.preventDefault();
            setIsMenuOpen(true);
            setInputValue('/');
            setIsTyping(true);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        } else if (e.key === 'Enter') {
            if (inputValue.trim() === '/reset') {
                setViewState('initial');
                setInputValue('');
                setIsTyping(false);
                setIsMenuOpen(false);
                return;
            }
            if (isMenuOpen && filteredOptions.length > 0) {
                handleSelect(filteredOptions[selectedIndex].id);
            }
        } else if (e.key === 'Escape') {
            setIsMenuOpen(false);
            setInputValue('');
            setIsTyping(false);
        }
    };

    const handleSelect = (id: string) => {
        setIsMenuOpen(false);
        setViewState('dashboard');
        setIsTyping(false);
        setSelectedVisual(id);
        setInputValue('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        setSelectedIndex(0);
        if (val.length > 0) {
            setIsTyping(true);
        } else {
            setIsTyping(false);
        }

        if (val.includes('/')) {
            setIsMenuOpen(true);
        } else {
            setIsMenuOpen(false);
        }
    };

    // Animation Variants
    const badgeVariants = {
        initial: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)'
        },
        typing: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)'
        },
        dashboard: {
            opacity: 0,
            y: -50,
            scale: 0.8,
            filter: 'blur(10px)',
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }
        }
    };

    const titleVariants = {
        initial: {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)'
        },
        typing: {
            opacity: 0.3, // Fade out slightly when typing to focus on bar
            scale: 0.98,
            filter: 'blur(2px)',
            transition: { duration: 0.4 }
        },
        dashboard: {
            opacity: 0,
            scale: 0.8,
            filter: 'blur(20px)',
            y: -100,
            transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }
        }
    };

    const barVariants = {
        initial: {
            width: '80%',
            maxWidth: '1200px',
            y: 0,
            scale: 1
        },
        typing: {
            width: '70%', // Get bigger
            maxWidth: '900px',
            y: -40, // Move up alittle
            scale: 1.05,
            transition: { duration: 0.4, ease: "easeOut" } as any
        },
        dashboard: {
            width: '30%',
            maxWidth: '400px',
            y: 300, // Go down
            scale: 0.8, // Get smaller
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as any } // Faster smooth animation
        }
    };

    return (
        <div className="min-h-screen w-full relative overflow-hidden !bg-[#0f1115] text-gray-200 font-sans selection:bg-purple-500/30 flex flex-col items-center justify-center z-50">

            {/* Shared Nexus Background */}
            <NexusBackground />

            {/* Blur Overlay during Typing */}
            <AnimatePresence>
                {isTyping && viewState === 'initial' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[#0f1115]/60 backdrop-blur-sm z-20 pointer-events-none"
                    />
                )}
            </AnimatePresence>

            {/* Return Home Arrow - Top Left */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setActivePage('home')}
                className="fixed top-8 left-8 p-3 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all z-[70] group"
            >
                <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
            </motion.button>

            {/* Main Content Container */}
            <div className="relative z-30 w-full h-full flex flex-col items-center justify-center">

                {/* Title */}
                <motion.h1
                    variants={titleVariants}
                    initial="initial"
                    animate={viewState === 'dashboard' ? 'dashboard' : (isTyping ? 'typing' : 'initial')}
                    className="text-7xl md:text-9xl font-black tracking-widest mb-4 text-center whitespace-nowrap"
                >
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-2xl">
                        THE VISION
                    </span>
                </motion.h1>

                {/* Header Badge - Moved below title, smaller, renamed */}
                <motion.div
                    variants={badgeVariants}
                    initial="initial"
                    animate={viewState === 'dashboard' ? 'dashboard' : (isTyping ? 'typing' : 'initial')}
                    className="mb-24 relative left-[20%]" // Positioning "below the N word" (approximate right side alignment)
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 text-[15px] font-medium backdrop-blur-md shadow-lg shadow-purple-500/5">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>NABD Brain & Vision</span>
                    </div>
                </motion.div>

                {/* Command Bar Container */}
                <motion.div
                    variants={barVariants}
                    initial="initial"
                    animate={isTyping ? 'typing' : viewState}
                    className="relative z-50"
                >
                    <div className="relative group">
                        {/* Electricity Shine Effect - Active when idle or typing */}
                        <div className={`absolute -inset-[2px] rounded-xl bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 ${viewState === 'initial' ? 'animate-shine opacity-70' : ''} blur-sm transition-all duration-500`}></div>

                        <div className="relative flex items-center justify-between px-8 py-2 bg-[#0f1115]/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl transition-all">
                            <div className="flex items-center gap-6 text-gray-400 flex-1">
                                <Command className={`w-5 h-5 text-gray-500 shrink-0 ${isTyping ? 'text-purple-400' : ''} transition-colors`} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Click / to display"
                                    className="bg-transparent border-none outline-none text-lg font-light tracking-wide text-white w-full placeholder-gray-500"
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-3 shrink-0">
                                <div className="w-2 h-2 rounded-full bg-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                <div className="w-2 h-2 rounded-full bg-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                                <div className="w-2 h-2 rounded-full bg-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                            {isMenuOpen && filteredOptions.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full left-0 right-0 mt-4 bg-[#0f1115]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                                >
                                    <div className="p-2">
                                        {filteredOptions.map((option, index) => (
                                            <div
                                                key={option.id}
                                                onClick={() => handleSelect(option.id)}
                                                className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-colors ${index === selectedIndex ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                                            >
                                                <option.icon size={18} className={index === selectedIndex ? 'text-purple-400' : 'text-gray-500'} />
                                                <span className="text-base font-medium">{option.label}</span>
                                                {index === selectedIndex && <span className="ml-auto text-xs text-gray-500">Enter</span>}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>

                {/* Dashboard Content - Fades in after transition */}
                <AnimatePresence>
                    {viewState === 'dashboard' && (
                        <motion.div
                            initial={{ opacity: 0, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, filter: isTyping ? 'blur(10px)' : 'blur(0px)' }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="absolute top-24 w-full h-[80vh] flex items-center justify-center pb-32"
                        >
                            {selectedVisual === 'grap-machine-krones-101' && <KronesMachineVisual />}

                            {selectedVisual === 'graph-dashboard' && (
                                <div className="grid grid-cols-2 gap-8 w-full max-w-6xl p-8">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="bg-[#0f1115]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 h-64 flex items-center justify-center relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <BarChart2 className="w-12 h-12 text-gray-600 group-hover:text-purple-400 transition-colors" />
                                            <div className="absolute bottom-4 left-6 text-sm text-gray-400 font-mono">CHART_MODULE_0{i}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Placeholder for other visuals */}
                            {!['grap-machine-krones-101', 'graph-dashboard'].includes(selectedVisual || '') && (
                                <div className="text-gray-500 text-xl font-mono">VISUAL_NOT_FOUND: {selectedVisual}</div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            <style>{`
        @keyframes shine {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
        }
        .animate-shine {
            background-size: 200% auto;
            animation: shine 3s linear infinite;
        }
      `}</style>

        </div>
    );
};

export default VisionPage;
