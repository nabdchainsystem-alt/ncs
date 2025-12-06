import React from 'react';
import { motion } from 'framer-motion';
import { Globe, ShoppingBag, Truck, Activity } from 'lucide-react';

const GlobalNetworkVisual = () => {
    return (
        <div className="relative w-full max-w-lg mx-auto aspect-square perspective-1000">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>

            <motion.div
                className="w-full h-full relative preserve-3d flex items-center justify-center"
                animate={{ rotateY: [0, 360], rotateX: [10, 0, 10] }}
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            >
                {/* Globe Wireframe */}
                <div className="relative w-64 h-64 rounded-full border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.2)] preserve-3d backdrop-blur-sm bg-blue-900/10">
                    {/* Longitude Lines */}
                    {[...Array(6)].map((_, i) => (
                        <div
                            key={`lon-${i}`}
                            className="absolute inset-0 rounded-full border border-blue-500/10"
                            style={{ transform: `rotateY(${i * 30}deg)` }}
                        />
                    ))}
                    {/* Latitude Rings */}
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={`lat-${i}`}
                            className="absolute left-1/2 top-1/2 rounded-full border border-blue-500/10"
                            style={{
                                width: `${Math.cos((i - 2) * 0.5) * 100}%`,
                                height: `${Math.cos(((i - 2) * 0.5)) * 100}%`, // Ellipse height for latitude
                                transform: `translate(-50%, -50%) rotateX(90deg) translateZ(${(i - 2) * 40}px)`
                            }}
                        />
                    ))}

                    {/* Nodes (Cities) */}
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={`city-${i}`}
                            className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"
                            style={{
                                transform: `rotateY(${i * 45}deg) rotateX(${Math.sin(i) * 45}deg) translateZ(128px)`
                            }}
                        />
                    ))}

                    {/* Connecting Arcs */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" style={{ transform: "scale(1.1)" }}>
                        {/* Simple arcs are hard in 3D CSS transform context without complex math, 
                             so we simulate connections with rotating rings for now or just localized lines if possible.
                             Here we just use a scanning effect.
                         */}
                    </svg>
                </div>
            </motion.div>

            {/* Floating UI Cards - Static relative to rotation for readability */}
            <motion.div
                className="absolute top-1/4 -right-4 bg-black/80 backdrop-blur border border-green-500/30 p-4 rounded-xl flex items-center gap-4 shadow-xl z-20"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
            >
                <div className="bg-green-500/20 p-2 rounded-lg">
                    <ShoppingBag size={20} className="text-green-400" />
                </div>
                <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Market Vol</div>
                    <div className="text-lg font-bold text-white">$4.2B <span className="text-xs text-green-400">+12%</span></div>
                </div>
            </motion.div>

            <motion.div
                className="absolute bottom-1/4 -left-4 bg-black/80 backdrop-blur border border-cyan-500/30 p-4 rounded-xl flex items-center gap-4 shadow-xl z-20"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
            >
                <div className="bg-cyan-500/20 p-2 rounded-lg">
                    <Truck size={20} className="text-cyan-400" />
                </div>
                <div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Active Fleets</div>
                    <div className="text-lg font-bold text-white">842 <span className="text-xs text-cyan-400">Live</span></div>
                </div>
            </motion.div>

        </div>
    );
};

const Marketplace3D: React.FC = () => {
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
                                <Globe className="text-blue-400" size={24} />
                            </div>
                            <span className="text-blue-400 font-mono text-sm tracking-wider uppercase">Global Network</span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold mb-6 text-white tracking-tighter drop-shadow-2xl">
                            Global <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-600">Marketplace</span>
                        </h2>
                        <p className="text-xl text-gray-300 max-w-2xl drop-shadow-lg leading-relaxed">
                            Command your supply chain. A unified interface connecting you to suppliers, logistics, and markets worldwide.
                        </p>
                    </motion.div>
                </div>

                {/* Visual Section (Right) */}
                <div className="w-full md:w-1/2 order-1 md:order-2 perspective-1000">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <GlobalNetworkVisual />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Marketplace3D;
