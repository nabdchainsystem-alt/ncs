import React, { useEffect, useRef, useState } from 'react';
import { GameEngine, GameStats } from './engine/GameEngine';
import { Zap, Shield, Crosshair, Activity } from 'lucide-react';

const TowerGamePage: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [engine, setEngine] = useState<GameEngine | null>(null);
    const [stats, setStats] = useState<GameStats>({ cash: 0, wave: 1, health: 100, maxHealth: 100 });

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

    const handleUpgrade = (type: 'damage' | 'speed' | 'range') => {
        if (!engine) return;
        if (type === 'damage') engine.upgradeDamage();
        if (type === 'speed') engine.upgradeSpeed();
        if (type === 'range') engine.upgradeRange();
    };

    return (
        <div className="h-full w-full bg-gray-900 relative overflow-hidden flex flex-col">
            {/* Top Bar Stats */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-8 z-10">
                <div className="flex items-center space-x-8">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Cash</span>
                        <span className="text-2xl font-bold text-green-400">${stats.cash}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Wave</span>
                        <span className="text-2xl font-bold text-blue-400">{stats.wave}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-4 w-64">
                    <Activity size={20} className="text-red-500" />
                    <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-red-500 transition-all duration-300"
                            style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-sm font-bold text-white">{stats.health}/{stats.maxHealth}</span>
                </div>
            </div>

            {/* Game Canvas */}
            <div className="flex-1 relative">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full block"
                />
            </div>

            {/* Bottom Upgrade Panel */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gray-900/90 backdrop-blur-md border-t border-gray-800 flex items-center justify-center space-x-4 px-8 z-10">
                <UpgradeButton
                    icon={<Zap size={20} />}
                    label="Damage"
                    cost={50}
                    onClick={() => handleUpgrade('damage')}
                    canAfford={stats.cash >= 50}
                />
                <UpgradeButton
                    icon={<Activity size={20} />}
                    label="Speed"
                    cost={50}
                    onClick={() => handleUpgrade('speed')}
                    canAfford={stats.cash >= 50}
                />
                <UpgradeButton
                    icon={<Crosshair size={20} />}
                    label="Range"
                    cost={50}
                    onClick={() => handleUpgrade('range')}
                    canAfford={stats.cash >= 50}
                />
            </div>
        </div>
    );
};

interface UpgradeButtonProps {
    icon: React.ReactNode;
    label: string;
    cost: number;
    onClick: () => void;
    canAfford: boolean;
}

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ icon, label, cost, onClick, canAfford }) => {
    return (
        <button
            onClick={onClick}
            disabled={!canAfford}
            className={`
                flex flex-col items-center justify-center w-24 h-20 rounded-lg border transition-all
                ${canAfford
                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-white cursor-pointer active:scale-95'
                    : 'bg-gray-900/50 border-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                }
            `}
        >
            <div className={`mb-1 ${canAfford ? 'text-blue-400' : 'text-gray-600'}`}>{icon}</div>
            <span className="text-xs font-bold uppercase">{label}</span>
            <span className="text-xs text-green-500 font-mono">${cost}</span>
        </button>
    );
};

export default TowerGamePage;
