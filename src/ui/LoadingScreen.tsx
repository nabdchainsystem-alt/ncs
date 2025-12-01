import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gray-100/30 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-gray-200/30 rounded-full blur-[120px] animate-pulse delay-1000" />
            </div>

            {/* Main Animation Container */}
            <div className="relative w-64 h-64 flex items-center justify-center">

                {/* Central Core */}
                <motion.div
                    className="absolute w-16 h-16 bg-gradient-to-tr from-gray-900 to-black rounded-2xl shadow-2xl shadow-black/30 z-20"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{
                        scale: [0, 1, 0.9, 1],
                        rotate: [0, 0, 180, 360],
                        borderRadius: ["50%", "30%", "50%", "30%"]
                    }}
                    transition={{
                        duration: 2,
                        ease: "easeInOut",
                        times: [0, 0.4, 0.7, 1],
                        repeat: Infinity,
                        repeatDelay: 0.5
                    }}
                />

                {/* Orbiting Rings */}
                {[0, 1, 2].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute border border-gray-200/50 rounded-full"
                        style={{
                            width: `${100 + i * 60}px`,
                            height: `${100 + i * 60}px`,
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: [0, 1, 0],
                            scale: [0.8, 1.2],
                            rotate: i % 2 === 0 ? 360 : -360
                        }}
                        transition={{
                            duration: 3,
                            delay: i * 0.2,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        {/* Orbiting Particle */}
                        <motion.div
                            className="absolute w-3 h-3 bg-black rounded-full shadow-lg shadow-black/50 top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    </motion.div>
                ))}

                {/* Connecting Lines (Synapses) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                        <motion.line
                            key={i}
                            x1="50%"
                            y1="50%"
                            x2={`${50 + 40 * Math.cos(angle * Math.PI / 180)}%`}
                            y2={`${50 + 40 * Math.sin(angle * Math.PI / 180)}%`}
                            stroke="url(#gradient)"
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{
                                pathLength: [0, 1, 0],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 2,
                                delay: 0.5 + i * 0.1,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#333333" />
                            <stop offset="100%" stopColor="#000000" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            {/* Loading Text */}
            <motion.div
                className="mt-12 flex flex-col items-center gap-2 z-20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-black tracking-tight">
                    Initializing System
                </h2>
                <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 bg-gray-400 rounded-full"
                            animate={{ y: [0, -6, 0] }}
                            transition={{
                                duration: 0.6,
                                delay: i * 0.1,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
