import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { GripVertical, Plus, X, Move } from 'lucide-react';
import clsx from 'clsx';

type CardSize = 'sm' | 'md' | 'lg';

interface OverviewCard {
    id: string;
    title: string;
    description: string;
    color: string;
    size: CardSize;
    x: number;
    y: number;
}

interface SpaceOverviewProps {
    storageKey: string;
}

const GRID_SIZE = 120;

const featuredCards: OverviewCard[] = [
    { id: 'ai-brain', title: 'AI Brain', description: 'Generate ideas and content with a custom prompt', color: '#f1f0ff', size: 'md', x: 0, y: 0 },
    { id: 'task-list', title: 'Tasks', description: 'Create a List view using tasks from any location', color: '#f8f1ff', size: 'md', x: 1, y: 0 },
    { id: 'workload-status', title: 'Workload by Status', description: 'Display a pie chart of your statuses usage', color: '#eaf7f5', size: 'md', x: 2, y: 0 },
    { id: 'calc', title: 'Calculation', description: 'Calculate sums, averages, and more', color: '#fef8ef', size: 'md', x: 0, y: 1 },
    { id: 'portfolio', title: 'Portfolio', description: 'Track progress across lists & folders', color: '#eef5ff', size: 'md', x: 1, y: 1 },
    { id: 'assignee', title: 'Tasks by Assignee', description: 'Pie chart of tasks grouped by assignee', color: '#eef4ff', size: 'md', x: 2, y: 1 },
    { id: 'notes', title: 'Notes', description: 'Add rich text, images, and links', color: '#fff7e6', size: 'md', x: 0, y: 2 },
    { id: 'discussion', title: 'Discussion', description: 'Collaborate and chat with members', color: '#fff0f4', size: 'md', x: 1, y: 2 },
    { id: 'bookmarks', title: 'Bookmarks', description: 'Quickly access important items', color: '#f0f6ff', size: 'md', x: 2, y: 2 },
];

const SpaceOverview: React.FC<SpaceOverviewProps> = ({ storageKey }) => {
    const [cards, setCards] = useState<OverviewCard[]>([]);
    const [dragId, setDragId] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
    const [showAdd, setShowAdd] = useState(false);

    const load = useMemo(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed as OverviewCard[];
            }
        } catch (err) {
            console.warn('Failed to load overview', err);
        }
        return featuredCards.slice(0, 3);
    }, [storageKey]);

    useEffect(() => {
        setCards(load);
    }, [load]);

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(cards));
        } catch (err) {
            console.warn('Failed to save overview', err);
        }
    }, [cards, storageKey]);

    const startDrag = (e: React.MouseEvent, id: string) => {
        const box = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setDragId(id);
        setDragOffset({ dx: e.clientX - box.left, dy: e.clientY - box.top });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    const onMove = useCallback((e: MouseEvent) => {
        if (!dragId) return;
        const x = Math.max(0, Math.round((e.clientX - dragOffset.dx) / GRID_SIZE));
        const y = Math.max(0, Math.round((e.clientY - dragOffset.dy - 120) / GRID_SIZE));
        setCards(prev => prev.map(c => c.id === dragId ? { ...c, x, y } : c));
    }, [dragId, dragOffset.dx, dragOffset.dy]);

    const onUp = useCallback(() => {
        setDragId(null);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
    }, [onMove]);

    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [onMove, onUp]);

    const removeCard = (id: string) => {
        setCards(prev => prev.filter(c => c.id !== id));
    };

    const cycleSize = (id: string) => {
        setCards(prev => prev.map(c => {
            if (c.id !== id) return c;
            const next: Record<CardSize, CardSize> = { sm: 'md', md: 'lg', lg: 'sm' };
            return { ...c, size: next[c.size] };
        }));
    };

    const addCard = (card: OverviewCard) => {
        if (cards.find(c => c.id === card.id)) return;
        setCards(prev => [...prev, { ...card, x: prev.length % 3, y: Math.floor(prev.length / 3) }]);
        setShowAdd(false);
    };

    const sizeClass = (size: CardSize) => {
        switch (size) {
            case 'lg': return 'w-[360px] h-[220px]';
            case 'md': return 'w-[280px] h-[200px]';
            default: return 'w-[220px] h-[180px]';
        }
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Overview</h2>
                    <p className="text-xs text-gray-500">Drag, drop, and resize cards to build your dashboard.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        className="px-3 py-2 rounded-md border border-gray-200 bg-white hover:border-gray-300 text-sm text-gray-700"
                        onClick={() => setCards([])}
                    >
                        Clear
                    </button>
                    <button
                        className="px-4 py-2 rounded-md bg-clickup-purple text-white text-sm font-medium hover:bg-indigo-700 shadow-sm"
                        onClick={() => setShowAdd(true)}
                    >
                        Add Card
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-auto bg-gray-50">
                <div className="absolute top-4 left-4 right-4 bottom-4">
                    <div className="grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${GRID_SIZE}px, 1fr))`, gap: 16 }}>
                        {cards.map(card => (
                            <div
                                key={card.id}
                                style={{ gridColumnStart: card.x + 1, gridRowStart: card.y + 1 }}
                                className={clsx(
                                    'relative rounded-xl shadow-sm border border-gray-200 bg-white cursor-move select-none',
                                    sizeClass(card.size)
                                )}
                                onMouseDown={(e) => startDrag(e, card.id)}
                            >
                                <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: card.color }} />
                                <div className="relative h-full flex flex-col p-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <GripVertical size={14} />
                                            <span className="text-[11px] uppercase font-semibold text-gray-400">Card</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="text-gray-400 hover:text-gray-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    cycleSize(card.id);
                                                }}
                                                title="Resize"
                                            >
                                                <Move size={14} />
                                            </button>
                                            <button
                                                className="text-gray-400 hover:text-red-500"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeCard(card.id);
                                                }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <h3 className="text-sm font-semibold text-gray-800">{card.title}</h3>
                                        <p className="text-xs text-gray-600 mt-1">{card.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-[90vw] max-w-5xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex">
                        <div className="w-64 border-r border-gray-200 bg-gray-50">
                            <div className="p-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <Plus size={14} /> Add Card
                            </div>
                            <div className="space-y-1 px-2">
                                {['Featured', 'Overview', 'AI Cards', 'Custom', 'Sprints', 'Statuses', 'Tags', 'Assignees', 'Priorities', 'Time Tracking', 'Tables', 'Embeds and Apps'].map(item => (
                                    <div key={item} className="px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-white font-medium">
                                        {item}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 border-t border-gray-200 pt-4 px-3 space-y-2 text-sm text-gray-500">
                                <div>Help Docs</div>
                                <div>Dashboard Webinar</div>
                                <div>Dashboard Guide</div>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-800">Featured</h3>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="w-64 border border-gray-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-clickup-purple/40"
                                    />
                                    <button
                                        className="text-gray-400 hover:text-gray-600"
                                        onClick={() => setShowAdd(false)}
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {featuredCards.map(card => (
                                        <button
                                            key={card.id}
                                            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col text-left overflow-hidden"
                                            onClick={() => addCard(card)}
                                        >
                                            <div className="h-32" style={{ background: card.color }}></div>
                                            <div className="p-3 space-y-1">
                                                <div className="text-sm font-semibold text-gray-800">{card.title}</div>
                                                <div className="text-xs text-gray-500">{card.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpaceOverview;
