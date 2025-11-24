import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Plus } from 'lucide-react';
import { useToast } from '../../ui/Toast';
import { HomeCard } from './types';
import { DraggableCard } from './components/DraggableCard';

interface HomeViewProps {
    cards?: HomeCard[];
    onUpdateCard?: (card: HomeCard) => void;
    onRemoveCard?: (id: string) => void;
    onOpenCustomize?: () => void;
    userName?: string;
}

// --- Mock Content Renderers for Cards ---



// --- Draggable Card Component ---



// --- Main Home View ---

const HomeView: React.FC<HomeViewProps> = ({
    cards = [],
    onUpdateCard = (_card) => { },
    onRemoveCard = (_id) => { },
    onOpenCustomize = () => { },
    userName = 'User'
}) => {
    const { showToast } = useToast();
    const hour = new Date().getHours();

    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(1600);

    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.clientWidth);
        }
        const handleResize = () => {
            if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    let greeting = 'Good morning';
    if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
    else if (hour >= 17) greeting = 'Good evening';

    const handleCardUpdate = (updatedCard: HomeCard, sideEffects: HomeCard[] = []) => {
        onUpdateCard(updatedCard);
        sideEffects.forEach(effect => onUpdateCard(effect));
    };

    if (cards.length > 0) {
        return (
            <div className="flex-1 bg-brand-surface flex flex-col h-full overflow-hidden relative">
                {/* Infinite Canvas Area */}
                <div className="flex-1 relative overflow-auto scrollbar-hide w-full h-full" style={{ backgroundImage: 'radial-gradient(#E5E7EB 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}>

                    {/* Greeting Header (Now inside scrollable area) */}
                    <div className="px-8 py-6 mb-4">
                        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{greeting}, {userName}</h1>
                    </div>

                    <div ref={containerRef} className="w-full h-full min-h-[1000px] relative">
                        {cards.map(card => (
                            <DraggableCard
                                key={card.instanceId}
                                card={card}
                                allCards={cards}
                                onUpdate={handleCardUpdate}
                                onRemove={onRemoveCard}
                                containerWidth={containerWidth}
                            />
                        ))}

                        <div className="absolute inset-0 z-0" onDoubleClick={onOpenCustomize} title="Double click to add card"></div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Empty State ---
    return (
        <div className="flex-1 bg-brand-surface flex flex-col h-full overflow-y-auto scrollbar-hide animate-in fade-in duration-500">
            <div className="w-full mx-auto p-8 md:p-12 flex flex-col h-full">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 tracking-tight">{greeting}, {userName}</h1>

                <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
                    {/* Illustration */}
                    <div className="relative w-80 h-64 mb-12 opacity-90 hover:opacity-100 transition-all duration-500 cursor-pointer group" onClick={onOpenCustomize}>
                        {/* Card 1 (Back Left) */}
                        <div className="absolute top-0 left-6 w-52 h-32 bg-white border border-gray-200 rounded-2xl shadow-card transform -rotate-6 z-10 flex flex-col p-4 space-y-3 transition-transform group-hover:-translate-y-3 group-hover:-rotate-12">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                                <div className="w-24 h-2.5 bg-gray-100 rounded-full"></div>
                            </div>
                            <div className="space-y-2 mt-2">
                                <div className="w-full h-2 bg-gray-50 rounded-full"></div>
                                <div className="w-3/4 h-2 bg-gray-50 rounded-full"></div>
                            </div>
                        </div>

                        {/* Card 2 (Back Right) */}
                        <div className="absolute top-8 right-6 w-52 h-32 bg-white border border-gray-200 rounded-2xl shadow-card transform rotate-6 z-0 flex flex-col p-4 items-end justify-between transition-transform group-hover:translate-x-3 group-hover:rotate-12">
                            <div className="w-10 h-2.5 bg-gray-100 rounded-full mb-2"></div>
                            <div className="w-full h-14 bg-gray-50 rounded-xl border border-gray-100 border-dashed flex items-center justify-center">
                                <LayoutGrid size={20} className="text-gray-200" />
                            </div>
                        </div>

                        {/* Card 3 (Front Center) */}
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-64 h-36 bg-white border border-gray-200 rounded-2xl shadow-2xl shadow-indigo-100 z-20 flex flex-col p-5 transition-transform group-hover:scale-105 ring-1 ring-black/5">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-brand-primary"></div>
                                    <div className="w-28 h-2.5 bg-gray-100 rounded-full"></div>
                                </div>
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center justify-between px-2">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl"></div>
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl"></div>
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl"></div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Plus Icon */}
                        <div className="absolute -top-4 right-10 w-12 h-12 bg-white border border-gray-100 rounded-2xl shadow-lg flex items-center justify-center z-30 animate-bounce duration-[2000ms]">
                            <Plus className="text-brand-primary" size={24} />
                        </div>
                    </div>

                    <h2 className="text-gray-500 text-center max-w-md mb-8 leading-relaxed text-lg font-medium">
                        Customize your workspace with drag-and-drop cards. <br />
                        <span className="text-sm text-gray-400">Build your perfect dashboard in seconds.</span>
                    </h2>

                    <button
                        className="bg-gray-900 hover:bg-black text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95 tracking-wide"
                        onClick={onOpenCustomize}
                    >
                        Customize Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomeView;