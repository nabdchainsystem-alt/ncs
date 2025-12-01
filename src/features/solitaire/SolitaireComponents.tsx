import React from 'react';
import { motion } from 'framer-motion';
import { Card, Suit } from './engine/SolitaireGame';

// --- Assets & Styles ---
// Reusing textures from Baloot for consistency
const WOOD_TEXTURE = "https://www.transparenttextures.com/patterns/wood-pattern.png";
const FELT_TEXTURE = "https://www.transparenttextures.com/patterns/felt.png";

interface SolitaireCardProps {
    card: Card;
    index?: number;
    isPlayable?: boolean;
    onClick?: () => void;
    onDragStart?: (e: React.DragEvent, card: Card, source: string, index: number) => void;
    source?: string; // 'tableau-0', 'waste', 'foundation-H', etc.
    style?: React.CSSProperties;
}

export const SolitaireCard: React.FC<SolitaireCardProps> = ({
    card,
    index = 0,
    isPlayable = false,
    onClick,
    onDragStart,
    source,
    style
}) => {
    const isRed = card.suit === 'H' || card.suit === 'D';

    const SuitIcon = ({ className }: { className?: string }) => {
        switch (card.suit) {
            case 'H': return <span className={`text-red-600 ${className}`}>♥</span>;
            case 'D': return <span className={`text-red-600 ${className}`}>♦</span>;
            case 'C': return <span className={`text-slate-900 ${className}`}>♣</span>;
            case 'S': return <span className={`text-slate-900 ${className}`}>♠</span>;
        }
    };

    return (
        <motion.div
            layoutId={`card-${card.id}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={isPlayable ? { y: -5, scale: 1.05, zIndex: 100 } : {}}
            whileTap={isPlayable ? { scale: 0.95 } : {}}
            onClick={isPlayable ? onClick : undefined}
            draggable={isPlayable && !!onDragStart}
            onDragStart={(e) => {
                if (isPlayable && onDragStart) {
                    // @ts-ignore
                    onDragStart(e, card, source, index);
                }
            }}
            className={`
        relative w-24 h-36 rounded-xl shadow-md transform-gpu preserve-3d transition-shadow duration-200 select-none
        ${isPlayable ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isPlayable ? 'hover:shadow-lg' : ''}
      `}
            style={{
                ...style,
                backgroundColor: 'white',
            }}
        >
            {!card.isFaceUp ? (
                // Card Back
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
                    <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="w-20 h-32 border-2 border-white/10 rounded-lg flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 opacity-20 blur-sm"></div>
                    </div>
                </div>
            ) : (
                // Card Front
                <div className="absolute inset-0 bg-white rounded-xl flex flex-col justify-between p-2 shadow-inner border border-gray-200 overflow-hidden">
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>

                    <div className="flex flex-col items-center self-start leading-none">
                        <span className={`text-xl font-bold ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.rank}</span>
                        <SuitIcon className="text-sm" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                        <SuitIcon className="text-7xl transform scale-150" />
                    </div>

                    <div className="flex flex-col items-center self-end leading-none rotate-180">
                        <span className={`text-xl font-bold ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.rank}</span>
                        <SuitIcon className="text-sm" />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

interface PilePlaceholderProps {
    type: 'foundation' | 'tableau' | 'stock';
    icon?: React.ReactNode;
    onClick?: () => void;
    onDrop?: (e: React.DragEvent) => void;
    highlight?: boolean;
}

export const PilePlaceholder: React.FC<PilePlaceholderProps> = ({ type, icon, onClick, onDrop, highlight }) => {
    return (
        <div
            className={`
                w-24 h-36 rounded-xl border-2 border-dashed flex items-center justify-center transition-colors
                ${highlight ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/20 bg-black/20'}
                ${onClick ? 'cursor-pointer hover:bg-white/5' : ''}
            `}
            onClick={onClick}
            onDragOver={(e) => {
                if (onDrop) {
                    e.preventDefault(); // Allow drop
                }
            }}
            onDrop={onDrop}
        >
            {icon ? (
                <div className="opacity-30 text-white text-4xl">{icon}</div>
            ) : (
                type === 'stock' && (
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center">
                        <span className="text-white/40 text-xs">RESTART</span>
                    </div>
                )
            )}
        </div>
    );
};
