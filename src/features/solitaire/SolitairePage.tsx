import React, { useState, useEffect, useRef } from 'react';
import { SolitaireGame, GameState, Card, Suit } from './engine/SolitaireGame';
import { SolitaireCard, PilePlaceholder } from './SolitaireComponents';
import { ArrowLeft, RefreshCw, Trophy, RotateCcw } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { motion, AnimatePresence } from 'framer-motion';

const WOOD_TEXTURE = "https://www.transparenttextures.com/patterns/wood-pattern.png";
const FELT_TEXTURE = "https://www.transparenttextures.com/patterns/felt.png";

const SolitairePage: React.FC = () => {
    const { setActivePage } = useNavigation();
    const gameRef = useRef<SolitaireGame>(new SolitaireGame());
    const [gameState, setGameState] = useState<GameState>(gameRef.current.state);
    const [draggedCard, setDraggedCard] = useState<{ card: Card, source: string, index: number } | null>(null);

    useEffect(() => {
        gameRef.current.startNewGame();
        updateState();
    }, []);

    const updateState = () => {
        setGameState({ ...gameRef.current.state });
    };

    const handleRestart = () => {
        gameRef.current = new SolitaireGame();
        gameRef.current.startNewGame();
        updateState();
    };

    const handleStockClick = () => {
        gameRef.current.drawCard();
        updateState();
    };

    const handleCardClick = (card: Card, source: string, index: number) => {
        // Auto-move logic (e.g., double click to move to foundation) could go here
        // For now, simple click doesn't do much unless it's the stock
        if (source === 'waste') {
            // Try to move to foundation first, then tableau
            if (gameRef.current.moveWasteToFoundation()) {
                updateState();
                return;
            }
            // Try tableau (simplified: just try first valid move)
            for (let i = 0; i < 7; i++) {
                if (gameRef.current.moveWasteToTableau(i)) {
                    updateState();
                    return;
                }
            }
        } else if (source.startsWith('tableau')) {
            const tableauIndex = parseInt(source.split('-')[1]);
            // Try to move to foundation
            if (index === gameState.tableau[tableauIndex].length - 1) { // Only top card
                if (gameRef.current.moveTableauToFoundation(tableauIndex)) {
                    updateState();
                    return;
                }
            }
        }
    };

    const handleDragStart = (e: React.DragEvent, card: Card, source: string, index: number) => {
        setDraggedCard({ card, source, index });
        // e.dataTransfer.setData('text/plain', JSON.stringify({ card, source, index }));
        // Custom drag image could be set here
    };

    const handleDrop = (e: React.DragEvent, target: string) => {
        e.preventDefault();
        if (!draggedCard) return;

        const { card, source, index } = draggedCard;
        let success = false;

        if (target.startsWith('tableau')) {
            const targetIndex = parseInt(target.split('-')[1]);

            if (source === 'waste') {
                success = gameRef.current.moveWasteToTableau(targetIndex);
            } else if (source.startsWith('tableau')) {
                const sourceIndex = parseInt(source.split('-')[1]);
                if (sourceIndex !== targetIndex) {
                    success = gameRef.current.moveTableauToTableau(sourceIndex, targetIndex, index);
                }
            } else if (source.startsWith('foundation')) {
                const suit = source.split('-')[1] as Suit;
                success = gameRef.current.moveFoundationToTableau(suit, targetIndex);
            }
        } else if (target.startsWith('foundation')) {
            // Only allow single card drops to foundation
            if (source === 'waste') {
                success = gameRef.current.moveWasteToFoundation();
            } else if (source.startsWith('tableau')) {
                const sourceIndex = parseInt(source.split('-')[1]);
                // Ensure we are dragging the last card of the tableau pile
                if (index === gameState.tableau[sourceIndex].length - 1) {
                    success = gameRef.current.moveTableauToFoundation(sourceIndex);
                }
            }
        }

        if (success) {
            updateState();
        }
        setDraggedCard(null);
    };

    return (
        <div className="w-full h-full bg-[#0f172a] relative overflow-hidden flex flex-col select-none">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900 to-black pointer-events-none"></div>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-50 pointer-events-none">
                <button
                    onClick={() => setActivePage('home')}
                    className="pointer-events-auto p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:scale-105 active:scale-95"
                >
                    <ArrowLeft size={24} />
                </button>

                {/* Score Board */}
                <div className="pointer-events-auto flex items-center gap-8 bg-black/40 backdrop-blur-xl px-10 py-4 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Score</span>
                        <span className="text-4xl font-black text-white font-mono">{gameState.score}</span>
                    </div>
                    <div className="h-12 w-[1px] bg-white/20"></div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Moves</span>
                        <span className="text-4xl font-black text-white font-mono">{gameState.moves}</span>
                    </div>
                </div>

                <div className="pointer-events-auto flex gap-3">
                    <button
                        onClick={handleRestart}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-white/80 hover:text-white backdrop-blur-md border border-white/10 transition-all hover:rotate-180 duration-500"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Main Table */}
            <div className="flex-1 relative m-4 md:m-12 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden isolate transform-gpu">
                {/* Wood Border */}
                <div
                    className="absolute inset-0 rounded-[3rem] z-0"
                    style={{
                        backgroundImage: `url(${WOOD_TEXTURE})`,
                        backgroundColor: '#3f2e22',
                        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)'
                    }}
                ></div>

                {/* Felt Surface */}
                <div
                    className="absolute inset-[15px] rounded-[2.5rem] z-0 overflow-hidden"
                    style={{
                        backgroundColor: '#1a472a',
                        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.9)'
                    }}
                >
                    <div className="absolute inset-0 opacity-40 mix-blend-multiply" style={{ backgroundImage: `url(${FELT_TEXTURE})` }}></div>

                    {/* Game Layout */}
                    <div className="absolute inset-0 p-8 flex flex-col items-center justify-start pt-24">

                        {/* Top Row: Stock, Waste, Foundations */}
                        <div className="flex gap-12 mb-12 w-full max-w-6xl justify-between px-8">
                            <div className="flex gap-6">
                                {/* Stock */}
                                <div className="relative">
                                    {gameState.stock.length > 0 ? (
                                        <SolitaireCard
                                            card={gameState.stock[gameState.stock.length - 1]}
                                            isPlayable={true}
                                            onClick={handleStockClick}
                                            source="stock"
                                        />
                                    ) : (
                                        <PilePlaceholder type="stock" onClick={handleStockClick} />
                                    )}
                                    {gameState.stock.length > 1 && (
                                        <div className="absolute top-0.5 left-0.5 w-24 h-36 bg-white/10 rounded-xl -z-10 border border-white/5"></div>
                                    )}
                                </div>

                                {/* Waste */}
                                <div className="relative min-w-[6rem]">
                                    {gameState.waste.map((card, idx) => {
                                        // Show last 3 cards fanned out
                                        if (idx < gameState.waste.length - 3) return null;
                                        const offset = Math.min(2, gameState.waste.length - 1 - idx) * 20;
                                        return (
                                            <div key={card.id} className="absolute top-0 left-0" style={{ transform: `translateX(${-(gameState.waste.length - 1 - idx) * 20}px)` }}>
                                                <SolitaireCard
                                                    card={card}
                                                    isPlayable={idx === gameState.waste.length - 1}
                                                    onClick={() => handleCardClick(card, 'waste', idx)}
                                                    onDragStart={handleDragStart}
                                                    source="waste"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Foundations */}
                            <div className="flex gap-4">
                                {(['H', 'D', 'C', 'S'] as Suit[]).map(suit => (
                                    <div
                                        key={suit}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => handleDrop(e, `foundation-${suit}`)}
                                    >
                                        {gameState.foundations[suit].length > 0 ? (
                                            <SolitaireCard
                                                card={gameState.foundations[suit][gameState.foundations[suit].length - 1]}
                                                isPlayable={true}
                                                onDragStart={handleDragStart}
                                                source={`foundation-${suit}`}
                                            />
                                        ) : (
                                            <PilePlaceholder
                                                type="foundation"
                                                icon={
                                                    suit === 'H' ? '♥' : suit === 'D' ? '♦' : suit === 'C' ? '♣' : '♠'
                                                }
                                                highlight={draggedCard?.card.suit === suit && draggedCard?.card.rank === 'A'}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tableau */}
                        <div className="flex gap-4 w-full max-w-6xl justify-center px-8">
                            {gameState.tableau.map((pile, pileIndex) => (
                                <div
                                    key={pileIndex}
                                    className="relative w-24 min-h-[20rem]"
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDrop(e, `tableau-${pileIndex}`)}
                                >
                                    {pile.length === 0 && (
                                        <PilePlaceholder
                                            type="tableau"
                                            highlight={draggedCard?.card.rank === 'K'}
                                        />
                                    )}
                                    {pile.map((card, cardIndex) => (
                                        <div
                                            key={card.id}
                                            className="absolute top-0 left-0 w-full"
                                            style={{
                                                top: `${cardIndex * (card.isFaceUp ? 30 : 10)}px`,
                                                zIndex: cardIndex
                                            }}
                                        >
                                            <SolitaireCard
                                                card={card}
                                                index={cardIndex}
                                                isPlayable={card.isFaceUp}
                                                onClick={() => handleCardClick(card, `tableau-${pileIndex}`, cardIndex)}
                                                onDragStart={handleDragStart}
                                                source={`tableau-${pileIndex}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* Win Overlay */}
                <AnimatePresence>
                    {gameState.isWon && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50"
                        >
                            <motion.div
                                initial={{ scale: 0.8, y: 50 }}
                                animate={{ scale: 1, y: 0 }}
                                className="bg-[#1e293b] border border-white/10 rounded-3xl p-10 text-center shadow-2xl max-w-lg w-full mx-4"
                            >
                                <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                                <h2 className="text-4xl font-black text-white mb-2 tracking-tight">You Won!</h2>
                                <p className="text-gray-400 mb-8">Congratulations! You've cleared the board.</p>
                                <div className="text-2xl font-bold text-white mb-8">Score: {gameState.score}</div>
                                <button
                                    onClick={handleRestart}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
                                >
                                    Play Again
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default SolitairePage;
