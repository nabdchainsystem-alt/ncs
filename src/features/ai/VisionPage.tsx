import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Command, ArrowLeft, Home, BarChart2, Database, PieChart, Activity, TrendingUp, DollarSign, Users } from 'lucide-react';
import { NexusBackground } from '../../ui/NexusBackground';
import { useNavigation } from '../../contexts/NavigationContext';

const VisionPage = () => {
    const { setActivePage } = useNavigation();
    const [viewState, setViewState] = useState<'initial' | 'dashboard'>('initial');
    const [inputValue, setInputValue] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
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
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        } else if (e.key === 'Enter') {
            if (isMenuOpen && filteredOptions.length > 0) {
                handleSelect(filteredOptions[selectedIndex].id);
            }
        } else if (e.key === 'Escape') {
            setIsMenuOpen(false);
            setInputValue('');
        }
    };

    const handleSelect = (id: string) => {
        setIsMenuOpen(false);
        setViewState('dashboard');
        // In a real app, we might route based on ID, but for this demo we show the dashboard
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        setSelectedIndex(0); // Reset selection on input change
        if (val.includes('/')) {
            setIsMenuOpen(true);
        } else {
            setIsMenuOpen(false);
        }
    };

    // Animation Variants
    const containerVariants = {
        initial: { opacity: 1 },
        dashboard: { opacity: 1 }
    };

    const badgeVariants = {
        initial: {
            opacity: 1,
            y: 0,
            position: 'fixed',
            top: '42%',
            left: '50%',
            x: '-50%',
            scale: 1
        },
        dashboard: {
            opacity: 0,
            y: -50,
            position: 'fixed',
            top: '42%',
            left: '50%',
            x: '-50%',
            scale: 0.8
        }
    };

    const titleVariants = {
        initial: {
            scale: 1,
            opacity: 1,
            position: 'fixed',
            top: '50%',
            left: '50%',
            x: '-50%',
            y: '-50%',
        },
        dashboard: {
            scale: 0.4,
            opacity: 1,
            position: 'fixed',
            top: '8%',
            left: '50%',
            x: '-50%',
            y: '0%',
        }
    };

    const barVariants = {
        initial: {
            width: '70%',
            maxWidth: '1000px',
            position: 'fixed',
            top: '62%',
            left: '50%',
            x: '-50%',
            y: '-50%',
            bottom: 'auto'
        },
        dashboard: {
            width: '25%',
            maxWidth: '400px',
            position: 'fixed',
            top: 'auto',
            bottom: '3rem',
            left: '50%',
            x: '-50%',
            y: '0%'
        }
    };

    return (
        <div className="min-h-screen w-full relative overflow-hidden !bg-[#0f1115] text-gray-200 font-sans selection:bg-purple-500/30 flex flex-col items-center justify-center z-50">

            {/* Shared Nexus Background */}
            <NexusBackground />

            {/* Main Content Container */}
            <motion.div
                variants={containerVariants}
                initial="initial"
                animate={viewState}
                className="relative z-10 w-full h-full"
            >

                {/* Header Badge - Animates out in dashboard mode */}
                <motion.div
                    variants={badgeVariants as any}
                    animate={viewState}
                    transition={{ duration: 0.8 }}
                    className="z-40"
                >
                    <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10 text-gray-400 text-lg font-medium backdrop-blur-md shadow-lg shadow-purple-500/5">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <span>NABD Intelligence</span>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    variants={titleVariants as any}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    animate={viewState}
                    className="font-black tracking-widest z-50 whitespace-nowrap text-7xl md:text-9xl"
                >
                    <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-500 drop-shadow-2xl">
                        THE VISION
                    </span>
                </motion.h1>

                {/* Command Bar Container */}
                <motion.div
                    variants={barVariants as any}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className="z-[60]"
                >
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
                        <div className="relative flex items-center justify-between px-8 py-2.5 bg-[#0f1115]/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl transition-all group-hover:border-white/20 group-hover:bg-[#0f1115]/90">
                            <div className="flex items-center gap-6 text-gray-400 flex-1">
                                <Command className="w-5 h-5 text-gray-500 shrink-0" />
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
                                    className="absolute bottom-full left-0 right-0 mb-4 bg-[#0f1115]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
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
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.8 }}
                            className="absolute top-24 w-full max-w-[90%] pb-32"
                        >
                            {/* Content removed for now as requested */}
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>

            {/* Exit Button - Bottom Left */}
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 }}
                onClick={() => setActivePage('home')}
                className="fixed bottom-8 left-8 flex items-center gap-3 px-6 py-3 bg-[#0f1115]/80 backdrop-blur-md border border-white/10 rounded-full text-gray-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all group shadow-lg z-[60]"
            >
                <div className="p-1.5 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
                    <Home size={18} className="text-purple-400 group-hover:text-purple-300" />
                </div>
                <span className="font-medium tracking-wide">Return Home</span>
            </motion.button>

        </div>
    );
};

export default VisionPage;
