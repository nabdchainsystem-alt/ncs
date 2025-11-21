import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Wind } from 'lucide-react';

export const InfoPanel = () => {
    const [currentFactIndex, setCurrentFactIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const facts = [
        {
            title: "Andromeda-X",
            description: "A rare barred spiral galaxy located in the Deep Field. Known for its vibrant high-energy core and extensive star-forming regions composed of exotic matter.",
            stats: [
                { label: "Star Count", value: "~400 Billion", icon: Sparkles, color: "text-purple-300", bg: "bg-purple-500/20" },
                { label: "Energy Output", value: "Type III Civilization", icon: Zap, color: "text-blue-300", bg: "bg-blue-500/20" },
                { label: "Rotation Speed", value: "220 km/s", icon: Wind, color: "text-pink-300", bg: "bg-pink-500/20" }
            ]
        },
        {
            title: "Milky Way Core",
            description: "The supermassive black hole Sagittarius A* resides here, surrounded by a dense cluster of ancient stars and high-velocity gas clouds orbiting at relativistic speeds.",
            stats: [
                { label: "Mass", value: "4.1 Million Suns", icon: Zap, color: "text-yellow-300", bg: "bg-yellow-500/20" },
                { label: "Diameter", value: "100,000 Light Years", icon: Wind, color: "text-green-300", bg: "bg-green-500/20" },
                { label: "Age", value: "13.6 Billion Years", icon: Sparkles, color: "text-orange-300", bg: "bg-orange-500/20" }
            ]
        },
        {
            title: "Nebula Cluster",
            description: "A stellar nursery where new stars are born from collapsing clouds of dust and hydrogen gas. The vibrant colors indicate different ionized elements like oxygen and sulfur.",
            stats: [
                { label: "Temperature", value: "10,000 K", icon: Zap, color: "text-red-300", bg: "bg-red-500/20" },
                { label: "Span", value: "50 Light Years", icon: Wind, color: "text-cyan-300", bg: "bg-cyan-500/20" },
                { label: "Composition", value: "Hydrogen / Helium", icon: Sparkles, color: "text-indigo-300", bg: "bg-indigo-500/20" }
            ]
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentFactIndex((prev) => (prev + 1) % facts.length);
                setIsTransitioning(false);
            }, 500); // Wait for fade out
        }, 8000); // Change every 8 seconds

        return () => clearInterval(interval);
    }, []);

    const currentFact = facts[currentFactIndex];

    return (
        <div className="absolute bottom-0 left-0 w-full pointer-events-none flex justify-center pb-6">
            <div className="w-full max-w-7xl mx-6 pointer-events-auto">
                <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-xl p-4 text-white shadow-2xl relative overflow-hidden group transition-all duration-500 hover:bg-black/90">

                    {/* Decorative background gradients - Subtle & Dark */}
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30"></div>
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-1000"></div>

                    <div className={`relative z-10 transition-opacity duration-500 ${isTransitioning ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                        <div className="flex flex-row items-center justify-between gap-8">

                            {/* Left: Title & Description */}
                            <div className="flex-1 text-left flex items-center gap-6">
                                <h2 className="text-2xl font-bold text-white tracking-tight shrink-0 min-w-[200px]">
                                    {currentFact.title}
                                </h2>
                                <div className="h-8 w-[1px] bg-white/10"></div>
                                <p className="text-xs text-gray-400 leading-relaxed font-light max-w-2xl line-clamp-2">
                                    {currentFact.description}
                                </p>
                            </div>

                            {/* Right: Stats Grid - Horizontal */}
                            <div className="flex flex-row gap-4 shrink-0">
                                {currentFact.stats.map((stat, idx) => (
                                    <div key={idx} className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className={`p-1.5 rounded-md ${stat.bg} ${stat.color} shadow-inner`}>
                                            <stat.icon size={14} className="animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">{stat.label}</p>
                                            <p className="text-xs font-bold text-gray-200">{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>

                        {/* Progress Bar */}
                        <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent w-full opacity-20">
                            <div key={currentFactIndex} className="h-full bg-white/40 w-full origin-left animate-[progress_8s_linear]"></div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes progress {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
            `}</style>
        </div>
    );
};
