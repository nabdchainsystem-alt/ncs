import React from 'react';
import { motion } from 'framer-motion';
import { Network, Brain, Sparkles, Cpu } from 'lucide-react';

const NeuralBrainVisual = () => {
    return (
        <div className="relative w-full max-w-lg mx-auto aspect-square perspective-1000">
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>

            <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="w-full h-full relative preserve-3d flex items-center justify-center p-12"
            >
                {/* Core Brain Sphere */}
                <div className="relative w-48 h-48 preserve-3d">
                    {/* Inner Core */}
                    <div className="absolute inset-0 bg-blue-600/10 rounded-full blur-md animate-pulse"></div>
                    <div className="absolute inset-4 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                        <Brain className="text-blue-200 w-16 h-16 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    </div>

                    {/* Orbiting Neural Nodes */}
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute inset-0 rounded-full border border-blue-400/30"
                            style={{
                                rotateX: i * 45 + 30,
                                rotateY: i * 20,
                            }}
                            animate={{ rotateZ: [0, 360] }}
                            transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "linear" }}
                        >
                            <div className="absolute top-0 left-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa] transform -translate-x-1/2 -translate-y-1/2"></div>
                        </motion.div>
                    ))}

                    {/* Floating Data Particles */}
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={`p-${i}`}
                            className="absolute w-1 h-1 bg-white rounded-full"
                            style={{
                                top: '50%',
                                left: '50%',
                                transform: `rotateY(${i * 30}deg) rotateX(${i * 15}deg) translateZ(${120}px)`
                            }}
                            animate={{
                                opacity: [0.2, 1, 0.2],
                                scale: [1, 1.5, 1]
                            }}
                            transition={{
                                duration: 2 + Math.random(),
                                repeat: Infinity,
                                delay: Math.random()
                            }}
                        />
                    ))}
                </div>

                {/* Floating Info Cards */}
                <motion.div
                    className="absolute -right-20 top-20 bg-black/80 backdrop-blur border border-blue-500/30 p-3 rounded-xl flex items-center gap-3 shadow-lg transform translate-z-20"
                    animate={{ y: [-10, 10, -10] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    style={{ transform: 'translateZ(50px)' }}
                >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <Cpu size={16} className="text-blue-400" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Processing</div>
                        <div className="text-sm font-bold text-white">128 TFlops</div>
                    </div>
                </motion.div>

                <motion.div
                    className="absolute -left-10 bottom-20 bg-black/80 backdrop-blur border border-purple-500/30 p-3 rounded-xl flex items-center gap-3 shadow-lg transform translate-z-20"
                    animate={{ y: [10, -10, 10] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    style={{ transform: 'translateZ(80px)' }}
                >
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Sparkles size={16} className="text-purple-400" />
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">Prediction</div>
                        <div className="text-sm font-bold text-white">99.9%</div>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
};

const AdvancedAnalytics3D: React.FC = () => {
    return (
        <div className="w-full py-24 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent pointer-events-none"></div>

            <div className="max-w-7xl w-full px-6 z-10 flex flex-col md:flex-row items-center gap-12 md:gap-24">
                <div className="w-full md:w-1/2 order-1 perspective-1000">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                    >
                        <NeuralBrainVisual />
                    </motion.div>
                </div>

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
