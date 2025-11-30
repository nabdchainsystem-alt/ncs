import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameStats } from './engine/GameEngine';
import { Zap, Shield, Crosshair, Activity, Target, AlertCircle, BarChart2, Cpu, Radio } from 'lucide-react';

const TowerGamePage: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [engine, setEngine] = useState<GameEngine | null>(null);
    const [stats, setStats] = useState<GameStats>({
        cash: 0,
        wave: 1,
        health: 100,
        maxHealth: 100,
        damage: 0,
        range: 0,
        fireRate: 0,
        critChance: 0,
        critMult: 0,
        enemiesAlive: 0
    });

    useEffect(() => {
        if (canvasRef.current && !engine) {
            const newEngine = new GameEngine(canvasRef.current, (newStats) => {
                setStats(newStats);
            });
            setEngine(newEngine);
            newEngine.start();

            return () => {
                newEngine.stop();
            };
        }
    }, [canvasRef]);

    const handleUpgrade = (type: 'damage' | 'speed' | 'range' | 'critChance' | 'critMult') => {
        if (!engine) return;
        if (type === 'damage') engine.upgradeDamage();
        if (type === 'speed') engine.upgradeSpeed();
        if (type === 'range') engine.upgradeRange();
        if (type === 'critChance') engine.upgradeCritChance();
        if (type === 'critMult') engine.upgradeCritMult();
    };

    return (
        <div className="h-full w-full bg-black relative overflow-hidden flex flex-col font-mono select-none">

            {/* Vignette Effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] z-10"></div>

            {/* Top Bar: Resources */}
            <div className="absolute top-0 left-0 right-0 h-20 flex items-start justify-between px-8 pt-6 z-20 pointer-events-none">
                <div className="flex items-center space-x-8 pointer-events-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-green-500/80 uppercase tracking-widest mb-1">Credits</span>
                        <div className="text-4xl font-bold text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.6)] font-mono tracking-tighter">
                            ${stats.cash.toLocaleString()}
                        </div>
                    </div>
                    <div className="h-10 w-[1px] bg-gradient-to-b from-transparent via-gray-700 to-transparent"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-blue-500/80 uppercase tracking-widest mb-1">Wave</span>
                        <div className="text-4xl font-bold text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.6)] font-mono tracking-tighter">
                            {stats.wave.toString().padStart(2, '0')}
                        </div>
                    </div>
                </div>

                {/* Health Bar - Holographic Style */}
                <div className="flex flex-col items-end w-96 pointer-events-auto">
                    <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-[10px] text-red-500/80 uppercase tracking-widest">Hull Integrity</span>
                        <span className="text-sm font-bold text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]">{Math.ceil(stats.health)}/{stats.maxHealth}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-900/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-800/50">
                        <div
                            className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(248,113,113,0.6)]"
                            style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Left Panel: Tower Stats - Transparent */}
            <div className="absolute left-8 top-32 bottom-32 w-64 flex flex-col space-y-6 z-20 pointer-events-none">
                <div className="flex items-center space-x-2 border-b border-gray-800/50 pb-2">
                    <Cpu size={16} className="text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">System Status</span>
                </div>

                <div className="space-y-4">
                    <StatRow label="Damage Output" value={stats.damage} icon={<Zap size={14} className="text-yellow-500" />} />
                    <StatRow label="Target Range" value={stats.range} icon={<Crosshair size={14} className="text-green-500" />} />
                    <StatRow label="Cycle Rate" value={`${(60 / stats.fireRate).toFixed(1)}/s`} icon={<Activity size={14} className="text-blue-500" />} />
                    <div className="h-[1px] w-full bg-gradient-to-r from-gray-800/50 to-transparent"></div>
                    <StatRow label="Crit Probability" value={`${(stats.critChance * 100).toFixed(0)}%`} icon={<Target size={14} className="text-purple-500" />} />
                    <StatRow label="Crit Amplifier" value={`${stats.critMult}x`} icon={<AlertCircle size={14} className="text-red-500" />} />
                </div>
            </div>

            {/* Right Panel: Wave Intel - Transparent */}
            <div className="absolute right-8 top-32 bottom-32 w-64 flex flex-col space-y-6 z-20 pointer-events-none">
                <div className="flex items-center justify-end space-x-2 border-b border-gray-800/50 pb-2">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">Scanner Feed</span>
                    <Radio size={16} className="text-cyan-400 animate-pulse" />
                </div>

                <div className="flex flex-col items-end space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">Hostiles Detected</span>
                    <span className="text-4xl font-bold text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] font-mono">{stats.enemiesAlive}</span>
                </div>

                <div className="flex-1 border border-gray-800/30 rounded-lg relative overflow-hidden flex items-center justify-center">
                    {/* Fake Radar Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(transparent_1px,rgba(0,255,255,0.05)_1px),linear-gradient(90deg,transparent_1px,rgba(0,255,255,0.05)_1px)] bg-[size:20px_20px]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1)_0%,transparent_70%)] animate-pulse"></div>
                    <span className="text-[10px] text-cyan-500/50 uppercase tracking-widest z-10">Sector Scan Active</span>
                </div>
            </div>

            {/* Game Canvas */}
            <div className="flex-1 relative z-0">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block"
                />
            </div>

            {/* Bottom Panel: Upgrades - Transparent Floating Buttons */}
            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center space-x-6 z-20 pointer-events-none">
                <div className="flex items-center space-x-4 pointer-events-auto p-4 rounded-2xl bg-gradient-to-t from-black/80 to-transparent backdrop-blur-[2px]">
                    <UpgradeButton
                        icon={<Zap size={20} />}
                        label="Damage"
                        cost={50}
                        onClick={() => handleUpgrade('damage')}
                        canAfford={stats.cash >= 50}
                        level={stats.damage / 5}
                    />
                    <UpgradeButton
                        icon={<Activity size={20} />}
                        label="Speed"
                        cost={50}
                        onClick={() => handleUpgrade('speed')}
                        canAfford={stats.cash >= 50}
                        level={Math.max(1, 12 - (stats.fireRate / 5))}
                    />
                    <UpgradeButton
                        icon={<Crosshair size={20} />}
                        label="Range"
                        cost={50}
                        onClick={() => handleUpgrade('range')}
                        canAfford={stats.cash >= 50}
                        level={stats.range / 20}
                    />
                    <div className="w-[1px] h-12 bg-gray-800/50 mx-2"></div>
                    <UpgradeButton
                        icon={<Target size={20} />}
                        label="Crit %"
                        cost={100}
                        onClick={() => handleUpgrade('critChance')}
                        canAfford={stats.cash >= 100}
                        level={stats.critChance * 20}
                        color="purple"
                    />
                    <UpgradeButton
                        icon={<AlertCircle size={20} />}
                        label="Crit Dmg"
                        cost={100}
                        onClick={() => handleUpgrade('critMult')}
                        canAfford={stats.cash >= 100}
                        level={stats.critMult * 2}
                        color="red"
                    />
                </div>
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

interface UpgradeButtonProps {
    icon: React.ReactNode;
    label: string;
    cost: number;
    onClick: () => void;
    canAfford: boolean;
    level: number;
    color?: 'blue' | 'purple' | 'red';
}

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ icon, label, cost, onClick, canAfford, level, color = 'blue' }) => {
    const colorClasses = {
        blue: 'text-blue-400 group-hover:text-blue-300 border-blue-500/30 group-hover:border-blue-400/60 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]',
        purple: 'text-purple-400 group-hover:text-purple-300 border-purple-500/30 group-hover:border-purple-400/60 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]',
        red: 'text-red-400 group-hover:text-red-300 border-red-500/30 group-hover:border-red-400/60 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]'
    };

    return (
        <button
            onClick={onClick}
            disabled={!canAfford}
            className={`
                group relative flex flex-col items-center justify-center w-20 h-20 rounded-xl border backdrop-blur-sm transition-all duration-300
                ${canAfford
                    ? `bg-gray-900/40 hover:bg-gray-800/60 hover:-translate-y-1 cursor-pointer ${colorClasses[color]}`
                    : 'bg-black/20 border-gray-800/30 text-gray-700 cursor-not-allowed opacity-40 grayscale'
                }
            `}
        >
            <div className={`mb-1 transition-transform group-hover:scale-110 duration-300`}>{icon}</div>
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">{label}</span>
            <span className={`text-[10px] font-mono mt-1 ${canAfford ? 'text-green-400' : 'text-gray-600'}`}>${cost}</span>

            {/* Level Indicator Dots */}
            <div className="absolute top-1 right-1 flex space-x-[1px]">
                {[...Array(Math.min(3, Math.floor(level)))].map((_, i) => (
                    <div key={i} className={`w-0.5 h-0.5 rounded-full ${canAfford ? 'bg-current opacity-50' : 'bg-gray-700'}`}></div>
                ))}
            </div>
        </button>
    );
};

export default TowerGamePage;
