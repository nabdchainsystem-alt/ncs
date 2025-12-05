import React from 'react';
import { motion } from 'framer-motion';
import { Network, Share2, Zap, Cpu, Layers } from 'lucide-react';

const HolographicPlane = () => {
    return (
        <div className="relative w-full max-w-lg mx-auto aspect-square perspective-1000">
            {/* Rotating Container */}
            <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-full h-full relative preserve-3d"
            >
                {/* Central Core */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-blue-500/10 rounded-full border border-blue-400/30 backdrop-blur-sm shadow-[0_0_50px_rgba(59,130,246,0.3)] flex items-center justify-center">
                    <div className="w-20 h-20 bg-blue-400/20 rounded-full animate-pulse flex items-center justify-center">
                        <Cpu className="text-blue-300 w-10 h-10" />
                    </div>
                </div>

                {/* Orbital Rings */}
                {[1, 2, 3].map((ring, i) => (
                    <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 rounded-full border border-blue-500/20"
                        style={{
                            width: `${200 + i * 80}px`,
                            height: `${200 + i * 80}px`,
                            x: '-50%',
                            y: '-50%',
                            rotateX: 70,
                        }}
                        animate={{ rotateZ: [0, 360] }}
                        transition={{ duration: 10 + i * 5, repeat: Infinity, ease: "linear", repeatType: "loop" }}
                    >
                        {/* Data Packets on Rings */}
                        <motion.div
                            className="absolute top-0 left-1/2 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                            animate={{ offsetDistance: "100%" }}
                            style={{ offsetPath: `path('M 0 0 A ${100 + i * 40} ${100 + i * 40} 0 1 1 0 1')` }} // Simplified for visual
                        />
                        <div className="absolute top-0 left-1/2 w-3 h-3 bg-blue-400 rounded-full blur-sm"></div>
                    </motion.div>
                ))}

                {/* Floating Nodes */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 w-12 h-12 bg-black/40 border border-cyan-500/30 backdrop-blur-md rounded-lg flex items-center justify-center shadow-lg backface-visible"
                        style={{
                            transform: `rotateY(${i * 60}deg) translateZ(180px)`,
                        }}
                    >
                        <Zap size={16} className="text-cyan-400" />
                    </motion.div>
                ))}

                {/* Connecting Lines (Simulated) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                    <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="transparent" />
                            <stop offset="50%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                    {[...Array(8)].map((_, i) => (
                        <motion.line
                            key={i}
                            x1="50%"
                            y1="50%"
                            x2={`${50 + Math.cos(i * Math.PI / 4) * 40}%`}
                            y2={`${50 + Math.sin(i * Math.PI / 4) * 40}%`}
                            stroke="url(#lineGradient)"
                            strokeWidth="1"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: [0, 1, 0] }}
                            transition={{ duration: 3, delay: i * 0.2, repeat: Infinity }}
                        />
                    ))}
                </svg>
            </motion.div>

            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
        </div>
    );
};

const AdvancedAnalytics3D: React.FC = () => {
    return (
        <div className="w-full py-24 flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent pointer-events-none"></div>

            <div className="max-w-7xl w-full px-6 z-10 flex flex-col md:flex-row items-center gap-12 md:gap-24">

                {/* Visual Section (Left) */}
                <div className="w-full md:w-1/2 order-1 perspective-1000">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
                        whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
                        transition={{ duration: 1 }}
                    >
                        <HolographicPlane />
                    </motion.div>
                </div>

                {/* Text Section (Right) */}
                <div className="w-full md:w-1/2 text-right order-2">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center justify-end gap-3 mb-6">
                            <span className="text-blue-400 font-mono text-sm tracking-wider uppercase">Neural Network</span>
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <Network className="text-blue-400" size={24} />
                            </div>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tighter drop-shadow-2xl">
                            Advanced <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">Insights</span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl ml-auto drop-shadow-lg leading-relaxed">
                            Uncover hidden patterns with AI-driven predictive modeling. A neural network of intelligence at your fingertips that evolves with your data.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedAnalytics3D;
