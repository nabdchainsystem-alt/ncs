import React from 'react';
import { motion } from 'framer-motion';
import { Globe, MapPin, ShoppingBag } from 'lucide-react';

const MapVisual = () => {
    // Simplified dot grid to represent a map
    const dots = [];
    for (let i = 0; i < 100; i++) {
        dots.push({
            x: Math.random() * 100,
            y: Math.random() * 100,
            opacity: Math.random() * 0.5 + 0.1,
            delay: Math.random() * 2
        });
    }

    const locations = [
        { x: 20, y: 30, label: "NY" },
        { x: 45, y: 25, label: "LDN" },
        { x: 75, y: 35, label: "TYO" },
        { x: 80, y: 65, label: "SYD" },
        { x: 30, y: 60, label: "SA" },
        { x: 60, y: 40, label: "DXB" },
    ];

    return (
        <div className="relative w-full max-w-lg mx-auto aspect-video">
            {/* Map Container */}
            <div className="absolute inset-0 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

                {/* Grid Background */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'radial-gradient(circle, #60a5fa 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                    }}
                ></div>

                {/* Abstract Map Dots */}
                {dots.map((dot, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-blue-400 rounded-full"
                        style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: dot.opacity }}
                        transition={{ duration: 1, delay: dot.delay }}
                    />
                ))}

                {/* Active Locations */}
                {locations.map((loc, i) => (
                    <div key={i} className="absolute" style={{ left: `${loc.x}%`, top: `${loc.y}%` }}>
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.5 + i * 0.1 }}
                            className="relative"
                        >
                            <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white/20 relative z-10"></div>
                            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75"></div>

                            {/* Connecting Lines (Abstract) */}
                            {i < locations.length - 1 && (
                                <svg className="absolute top-1.5 left-1.5 w-40 h-40 pointer-events-none overflow-visible" style={{ transform: 'translate(-50%, -50%)' }}>
                                    <motion.line
                                        x1="50%" y1="50%"
                                        x2={`${(locations[i + 1].x - loc.x) * 4 + 50}%`}
                                        y2={`${(locations[i + 1].y - loc.y) * 4 + 50}%`}
                                        stroke="#60a5fa"
                                        strokeWidth="1"
                                        strokeDasharray="4 4"
                                        initial={{ pathLength: 0, opacity: 0 }}
                                        whileInView={{ pathLength: 1, opacity: 0.3 }}
                                        transition={{ duration: 1.5, delay: 1 + i * 0.2 }}
                                    />
                                </svg>
                            )}
                        </motion.div>
                    </div>
                ))}

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none"></div>
            </div>

            {/* Floating Card */}
            <motion.div
                initial={{ x: 20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute -bottom-6 -right-6 bg-[#0a0a0a] border border-white/10 p-4 rounded-xl shadow-xl flex items-center gap-4"
            >
                <div className="bg-green-500/20 p-2 rounded-lg">
                    <ShoppingBag size={20} className="text-green-400" />
                </div>
                <div>
                    <div className="text-xs text-gray-400">Total Volume</div>
                    <div className="text-lg font-bold text-white">$4.2B</div>
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
                <div className="w-full md:w-1/2 order-1 md:order-2">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                    >
                        <MapVisual />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Marketplace3D;
