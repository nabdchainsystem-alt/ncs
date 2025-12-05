import React from 'react';
import { motion } from 'framer-motion';
import { Globe, TrendingUp, Users, ShoppingCart, MapPin } from 'lucide-react';

const MarketplaceSection: React.FC = () => {
    return (
        <div className="w-full min-h-[80vh] bg-[#050505] flex flex-col justify-center items-center py-20 relative overflow-hidden border-b border-white/5 perspective-[2000px]">
            <div className="max-w-7xl w-full px-6 z-10">
                <div className="mb-20 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tighter">
                            Global <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">Marketplace</span>
                        </h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Connect with suppliers worldwide. Browse catalogs and request quotations instantly.
                        </p>
                    </motion.div>
                </div>

                <div className="relative w-full h-[600px] flex items-center justify-center">
                    {/* Main Dashboard Panel */}
                    <motion.div
                        initial={{ opacity: 0, rotateX: 20, z: -100 }}
                        whileInView={{ opacity: 1, rotateX: 10, z: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute w-[90%] h-full bg-[#0a0a0a] rounded-3xl border border-white/10 p-8 shadow-2xl overflow-hidden transform-gpu"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* Map Background */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-no-repeat bg-center bg-cover filter invert brightness-50"></div>
                        </div>

                        {/* Floating Widgets */}
                        <div className="relative z-10 h-full grid grid-cols-3 grid-rows-2 gap-6 p-4">

                            {/* Stats Card 1 */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="col-span-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-blue-500/10 rounded-xl">
                                        <TrendingUp className="text-blue-400" size={24} />
                                    </div>
                                    <span className="text-green-400 text-sm font-mono">+12.5%</span>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white mb-1">2,543</div>
                                    <div className="text-gray-400 text-sm">Active Suppliers</div>
                                </div>
                            </motion.div>

                            {/* Map Visualization Area */}
                            <div className="col-span-2 row-span-2 relative">
                                {/* Animated Connection Lines (Mock) */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <motion.path
                                        d="M 100 200 Q 250 100 400 200"
                                        fill="none"
                                        stroke="url(#gradient1)"
                                        strokeWidth="2"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        whileInView={{ pathLength: 1, opacity: 0.5 }}
                                        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                    />
                                    <defs>
                                        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                                            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>

                                {/* Hotspots */}
                                {[
                                    { top: '30%', left: '20%' },
                                    { top: '45%', left: '50%' },
                                    { top: '35%', left: '70%' },
                                    { top: '60%', left: '80%' },
                                ].map((pos, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                                        style={pos}
                                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
                                    >
                                        <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping"></div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Stats Card 2 */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                whileInView={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="col-span-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-white/20 transition-colors"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-purple-500/10 rounded-xl">
                                        <ShoppingCart className="text-purple-400" size={24} />
                                    </div>
                                    <span className="text-green-400 text-sm font-mono">+8.2%</span>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white mb-1">$4.2M</div>
                                    <div className="text-gray-400 text-sm">Transaction Volume</div>
                                </div>
                            </motion.div>

                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default MarketplaceSection;
