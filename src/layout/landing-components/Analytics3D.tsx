import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Activity } from 'lucide-react';

const AnalyticsCard = () => {
    return (
        <div className="relative w-full max-w-lg mx-auto">
            {/* Main Glass Card */}
            <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-white font-semibold text-lg">Platform Overview</h3>
                        <p className="text-gray-400 text-xs">Real-time data processing</p>
                    </div>
                    <div className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                        Live
                    </div>
                </div>

                {/* Main Chart Area (Abstract) */}
                <div className="h-32 flex items-end justify-between gap-2 mb-8 px-2">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((height, i) => (
                        <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            whileInView={{ height: `${height}%` }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                            className="w-full bg-gradient-to-t from-blue-600/50 to-cyan-400/50 rounded-t-sm relative group"
                        >
                            <div className="absolute inset-0 bg-cyan-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </motion.div>
                    ))}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <Users size={14} className="text-blue-400" />
                            <span className="text-gray-400 text-xs">Active Users</span>
                        </div>
                        <div className="text-xl font-bold text-white">24.5k</div>
                        <div className="text-green-400 text-[10px] flex items-center gap-1">
                            <TrendingUp size={10} /> +12%
                        </div>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                            <Activity size={14} className="text-cyan-400" />
                            <span className="text-gray-400 text-xs">Throughput</span>
                        </div>
                        <div className="text-xl font-bold text-white">1.2 TB</div>
                        <div className="text-green-400 text-[10px] flex items-center gap-1">
                            <TrendingUp size={10} /> +8%
                        </div>
                    </div>
                </div>

                {/* Decorative Glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* Background Elements for Depth */}
            <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -z-10 top-10 -right-10 w-24 h-24 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl"
            ></motion.div>
            <motion.div
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -z-10 -bottom-5 -left-5 w-32 h-32 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl"
            ></motion.div>
        </div>
    );
};

const Analytics3D: React.FC = () => {
    return (
        <div className="w-full py-24 flex flex-col justify-center items-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/5 to-transparent pointer-events-none"></div>

            <div className="max-w-7xl w-full px-6 z-10 flex flex-col md:flex-row items-center gap-12 md:gap-24">
                {/* Text Section (Left) */}
                <div className="w-full md:w-1/2 text-left order-2 md:order-1">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                <BarChart3 className="text-blue-400" size={24} />
                            </div>
                            <span className="text-blue-400 font-mono text-sm tracking-wider uppercase">Analytics Engine</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tighter drop-shadow-2xl">
                            Next-Gen <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">Analytics</span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl drop-shadow-lg leading-relaxed">
                            The heart of your data. A centralized, intelligent core processing millions of signals in real-time to provide actionable insights instantly.
                        </p>
                    </motion.div>
                </div>

                {/* Visual Section (Right) */}
                <div className="w-full md:w-1/2 order-1 md:order-2">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <AnalyticsCard />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Analytics3D;
