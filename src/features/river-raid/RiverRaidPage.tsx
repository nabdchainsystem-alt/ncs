import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './engine/GameEngine';
import { ArrowLeft } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';

const RiverRaidPage: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const { setActivePage } = useNavigation();

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        // Set canvas size to window size or fixed aspect ratio
        canvas.width = 800;
        canvas.height = 600;

        const engine = new GameEngine(canvas, (finalScore) => {
            setIsGameOver(true);
            setScore(finalScore);
        });

        engineRef.current = engine;
        engine.start();

        const handleRestart = (e: KeyboardEvent) => {
            if (engine.isGameOver && e.code === 'KeyR') {
                // Simple reload for now, or reset engine
                window.location.reload();
                // Ideally: engine.reset(); engine.start(); setIsGameOver(false);
            }
        };
        window.addEventListener('keydown', handleRestart);

        return () => {
            engine.stop();
            window.removeEventListener('keydown', handleRestart);
        };
    }, []);

    return (
        <div className="flex flex-col items-center justify-center h-full bg-zinc-900 relative">
            {/* Header / Back Button */}
            <div className="absolute top-4 left-4 z-10">
                <button
                    onClick={() => setActivePage('home')}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
                >
                    <ArrowLeft size={20} />
                    <span>Back to Home</span>
                </button>
            </div>

            <div className="relative border-4 border-zinc-700 rounded-lg overflow-hidden shadow-2xl">
                <canvas
                    ref={canvasRef}
                    className="block bg-blue-900"
                    style={{ width: '800px', height: '600px' }}
                />

                {/* Overlay Instructions */}
                {!engineRef.current?.animationId && !isGameOver && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white pointer-events-none">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold mb-4">RIVER RAID</h1>
                            <p>Arrow Keys to Move & Accelerate</p>
                            <p>Space to Shoot</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-4 text-zinc-400 text-sm">
                <p>Controls: Arrows to Move/Speed | Space to Shoot | Fly over FUEL to refuel</p>
            </div>
        </div>
    );
};

export default RiverRaidPage;
