import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, Wind, Activity, Cpu, Radio, Globe, Clock, Database, Wifi, Navigation, Rocket } from 'lucide-react';

interface InfoPanelProps {
    currentGalaxy: { id: string; name: string };
    galaxies: { id: string; name: string }[];
    onTravel: (index: number) => void;
    isWarping: boolean;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ currentGalaxy, galaxies, onTravel, isWarping }) => {
    const [time, setTime] = useState(new Date());
    const [fps, setFps] = useState(60);
    const [objects, setObjects] = useState(200000);

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date());
            setFps(Math.floor(58 + Math.random() * 4));
            setObjects(prev => prev + Math.floor(Math.random() * 10 - 5));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 z-20 font-mono select-none">

            {/* Top Bar */}
            <div className="flex justify-between items-start pointer-events-auto">
                <div className="flex flex-col">
                    <div className="flex items-center space-x-2 text-cyan-400 mb-1">
                        <Globe size={16} className="animate-pulse" />
                        <span className="text-xs font-bold tracking-[0.2em] uppercase">COSMOS</span>
                    </div>
                    <div className="text-4xl font-bold text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] tracking-tighter">
                        {isWarping ? 'WARP TRAVEL' : currentGalaxy.name.toUpperCase()}
                    </div>
                </div>

                <div className="flex flex-col items-end">
                    <div className="flex items-center space-x-2 text-cyan-400 mb-1">
                        <Clock size={16} />
                        <span className="text-xs font-bold tracking-[0.2em] uppercase">Mission Time</span>
                    </div>
                    <div className="text-4xl font-bold text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] tracking-tighter">
                        {time.toLocaleTimeString([], { hour12: false })}
                    </div>
                </div>
            </div>

            {/* Middle Section */}
            <div className="flex-1 flex justify-between items-center mt-12 mb-12">

                {/* Left Panel: Diagnostics */}
                <div className={`w-64 flex flex-col space-y-6 pointer-events-auto transition-opacity duration-500 ${isWarping ? 'opacity-50' : 'opacity-100'}`}>
                    <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
                        <Cpu size={16} className="text-cyan-400" />
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">System Diagnostics</span>
                    </div>

                    <div className="space-y-4">
                        <StatRow label="Render FPS" value={fps} icon={<Activity size={14} className="text-green-400" />} />
                        <StatRow label="Object Count" value={objects.toLocaleString()} icon={<Database size={14} className="text-blue-400" />} />
                        <StatRow label="Engine Temp" value={isWarping ? "CRITICAL" : "342 K"} icon={<Zap size={14} className={isWarping ? "text-red-500 animate-pulse" : "text-yellow-400"} />} />
                        <div className="h-[1px] w-full bg-gradient-to-r from-white/10 to-transparent"></div>
                        <StatRow label="Warp Drive" value={isWarping ? "ENGAGED" : "READY"} icon={<Rocket size={14} className={isWarping ? "text-orange-500" : "text-green-400"} />} />
                    </div>
                </div>

                {/* Right Panel: Navigation */}
                <div className="w-64 flex flex-col space-y-6 pointer-events-auto text-right">
                    <div className="flex items-center justify-end space-x-2 border-b border-white/10 pb-2">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Navigation Systems</span>
                        <Navigation size={16} className="text-cyan-400" />
                    </div>

                    <div className="flex flex-col space-y-2">
                        {galaxies.map((galaxy, idx) => (
                            <button
                                key={galaxy.id}
                                onClick={() => onTravel(idx)}
                                disabled={isWarping || galaxy.id === currentGalaxy.id}
                                className={`
                                    group flex items-center justify-end space-x-3 p-2 rounded border transition-all duration-300
                                    ${galaxy.id === currentGalaxy.id
                                        ? 'bg-cyan-500/20 border-cyan-500/50 cursor-default'
                                        : 'bg-black/40 border-white/10 hover:bg-white/10 hover:border-white/30 cursor-pointer'
                                    }
                                    ${isWarping ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <span className={`text-xs font-bold tracking-wider ${galaxy.id === currentGalaxy.id ? 'text-cyan-300' : 'text-gray-400 group-hover:text-white'}`}>
                                    {galaxy.name.toUpperCase()}
                                </span>
                                <div className={`w-2 h-2 rounded-full ${galaxy.id === currentGalaxy.id ? 'bg-cyan-400 animate-pulse' : 'bg-gray-600 group-hover:bg-white'}`}></div>
                            </button>
                        ))}
                    </div>

                    {isWarping && (
                        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 animate-[progress_2s_ease-in-out_infinite]"></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Panel: Data Stream */}
            <div className="flex justify-center pointer-events-auto">
                <FactStream />
            </div>
        </div>
    );
};

const StatRow: React.FC<{ label: string, value: string | number, icon: React.ReactNode }> = ({ label, value, icon }) => (
    <div className="flex items-center justify-between group">
        <div className="flex items-center space-x-3">
            <div className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</div>
            <span className="text-[10px] text-gray-500 uppercase tracking-widest group-hover:text-gray-300 transition-colors">{label}</span>
        </div>
        <span className="text-sm font-bold text-gray-300 font-mono group-hover:text-white transition-colors group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]">{value}</span>
    </div>
);

const FactStream = () => {
    const [currentFactIndex, setCurrentFactIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const facts = [
        { title: "SCANNING SECTOR", desc: "No anomalies detected. Trajectory clear." },
        { title: "DARK MATTER", desc: "Concentration stable at 24.5%. Sensors calibrated." },
        { title: "COMMUNICATIONS", desc: "Subspace link active. Signal strength 98%." }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIsTransitioning(true);
            setTimeout(() => {
                setCurrentFactIndex((prev) => (prev + 1) % facts.length);
                setIsTransitioning(false);
            }, 500);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const currentFact = facts[currentFactIndex];

    return (
        <div className="w-full max-w-2xl bg-gradient-to-r from-transparent via-black/40 to-transparent backdrop-blur-sm border-t border-b border-white/5 py-3 px-8 flex items-center justify-center space-x-6">
            <div className={`flex items-center space-x-4 transition-opacity duration-500 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest border-r border-white/10 pr-4">
                    System Log
                </span>
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-white tracking-wide">{currentFact.title}</span>
                    <span className="text-xs text-gray-400 font-mono">{currentFact.desc}</span>
                </div>
            </div>
        </div>
    );
};
