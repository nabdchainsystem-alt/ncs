import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Sparkles, MousePointer2 } from 'lucide-react';
import { KronesMachineVisual } from '../../features/ai/components/KronesMachineVisual';
import { HuskyMachineVisual } from '../../features/ai/components/HuskyMachineVisual';

const BrainVisionSection: React.FC = () => {
    const [animationState, setAnimationState] = useState<'idle' | 'typing' | 'menu' | 'dashboard'>('idle');
    const [currentVisual, setCurrentVisual] = useState<'krones' | 'husky'>('krones');
    const [typedText, setTypedText] = useState("");

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        const runAnimation = () => {
            // Reset
            setAnimationState('idle');
            setTypedText("");

            // Start Typing
            timeout = setTimeout(() => {
                setAnimationState('typing');

                setCurrentVisual(prev => {
                    const next = prev === 'krones' ? 'husky' : 'krones';
                    const text = next === 'krones'
                        ? "/visualize krones_production_line"
                        : "/ Grap Husky Plastic Injection Molding";

                    // Start typing animation with the NEW text
                    let i = 0;
                    const typeInterval = setInterval(() => {
                        setTypedText(text.substring(0, i + 1));
                        i++;
                        if (i === text.length) {
                            clearInterval(typeInterval);
                            // Show Menu
                            setTimeout(() => {
                                setAnimationState('menu');
                                // Select and Show Dashboard
                                setTimeout(() => {
                                    setAnimationState('dashboard');
                                    // Restart Loop
                                    setTimeout(runAnimation, 12000);
                                }, 1500);
                            }, 500);
                        }
                    }, 50);

                    return next;
                });

            }, 1000);
        };

        runAnimation();

        return () => clearTimeout(timeout);
    }, []);

    return (
        <div className="relative z-10 py-10 overflow-hidden">
            <div className="w-full px-6">
                <div className="flex flex-col items-center gap-12 text-center">

                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="max-w-5xl space-y-4 mx-auto"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-white/70 font-bold tracking-widest uppercase text-2xl"
                        >
                            Introducing
                        </motion.div>

                        <h2 className="text-6xl md:text-8xl font-black leading-tight tracking-tight text-white">
                            NABD <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-200 via-white to-gray-400">Brain & Vision</span>
                        </h2>

                        <p className="text-2xl md:text-3xl text-gray-400 leading-relaxed font-light max-w-4xl mx-auto pt-4">
                            Experience the power of a fully integrated AI terminal. Execute complex commands, visualize data in real-time, and let the system optimize your entire operation automatically.
                        </p>
                    </motion.div>

                    {/* Visual Container - Interactive Animation */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="w-full max-w-[110rem] mx-auto h-[600px]"
                    >
                        <div className="relative rounded-3xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden w-full h-full flex flex-col items-center justify-center">

                            {/* Grid Background */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]"></div>

                            {/* Content Container */}
                            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">

                                {/* Command Bar */}
                                <motion.div
                                    animate={{
                                        y: animationState === 'dashboard' ? -50 : 0,
                                        opacity: animationState === 'dashboard' ? 0 : 1,
                                        scale: animationState === 'dashboard' ? 0.9 : 1,
                                        pointerEvents: animationState === 'dashboard' ? 'none' : 'auto'
                                    }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full max-w-3xl relative group z-20"
                                >
                                    <div className="absolute -inset-1 bg-white/10 rounded-2xl opacity-50 blur-lg transition-opacity duration-500"></div>
                                    <div className="relative bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex items-center shadow-2xl">
                                        <div className="flex items-center space-x-4 text-gray-400 flex-1 font-mono text-lg">
                                            <Command size={24} />
                                            <div className="border-l border-gray-700 pl-4 h-6 flex items-center w-full">
                                                {typedText}
                                                <motion.span
                                                    animate={{ opacity: [0, 1, 0] }}
                                                    transition={{ repeat: Infinity, duration: 0.8 }}
                                                    className="w-2 h-5 bg-white ml-1"
                                                />
                                                {typedText === "" && <span className="text-gray-600 ml-2">Click / to display</span>}
                                            </div>
                                        </div>

                                        {/* Traffic Lights */}
                                        <div className="flex space-x-2">
                                            <div className="w-3 h-3 rounded-full bg-white/20"></div>
                                            <div className="w-3 h-3 rounded-full bg-white/20"></div>
                                            <div className="w-3 h-3 rounded-full bg-white/20"></div>
                                        </div>
                                    </div>

                                    {/* Mouse Cursor Simulation */}
                                    {animationState === 'idle' && (
                                        <motion.div
                                            initial={{ opacity: 0, x: 100, y: 100 }}
                                            animate={{ opacity: 1, x: 0, y: 0 }}
                                            transition={{ duration: 1 }}
                                            className="absolute bottom-[-20px] right-[-20px] z-50 pointer-events-none"
                                        >
                                            <MousePointer2 className="text-white fill-white drop-shadow-lg" size={32} />
                                        </motion.div>
                                    )}

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {animationState === 'menu' && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, height: 0 }}
                                                animate={{ opacity: 1, y: 10, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl"
                                            >
                                                <div className="p-2 space-y-1">
                                                    <div className="flex items-center justify-between px-4 py-3 bg-white/10 text-white rounded-lg cursor-pointer">
                                                        <div className="flex items-center space-x-3">
                                                            <Sparkles size={18} />
                                                            <span className="font-medium">
                                                                {currentVisual === 'krones' ? 'Visualize Production Line' : 'Visualize Injection Molding'}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs opacity-70">↵ Enter</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Krones Machine Reveal */}
                                <AnimatePresence>
                                    {animationState === 'dashboard' && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="absolute inset-0 z-10"
                                        >
                                            {currentVisual === 'krones' ? <KronesMachineVisual /> : <HuskyMachineVisual />}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default BrainVisionSection;
