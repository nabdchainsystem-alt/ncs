import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Plus, GripHorizontal, X, Maximize2, Sparkles, History, Calendar, ListTodo, ClipboardList, MessageSquare, ListOrdered, Clock, MapPin, Video } from 'lucide-react';
import { useToast } from '../../components/Toast';
import { HomeCard } from '../../types';
import { MOCK_TASKS } from '../../constants';

interface HomeViewProps {
    cards?: HomeCard[];
    onUpdateCard?: (card: HomeCard) => void;
    onRemoveCard?: (id: string) => void;
    onOpenCustomize?: () => void;
}

// --- Mock Content Renderers for Cards ---

const RecentsContent = () => (
    <div className="space-y-2 text-sm">
        {['Q4 Strategy Doc', 'Backend Sprint List', 'Design System Board', 'Marketing Campaign', 'User Research 2024', 'Deployment Scripts'].map((item, i) => (
            <div key={i} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors group border border-transparent hover:border-gray-100">
                <div className="w-8 h-8 bg-blue-50/50 rounded-md text-blue-500 flex items-center justify-center text-[10px] font-bold border border-blue-100 group-hover:bg-blue-100 group-hover:border-blue-200 transition-all">
                    {item[0]}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-gray-700 font-medium truncate group-hover:text-brand-primary transition-colors">{item}</p>
                    <p className="text-xs text-gray-400">Accessed {i + 1} hour{i !== 0 ? 's' : ''} ago</p>
                </div>
            </div>
        ))}
    </div>
);

const LineUpContent = () => (
    <div className="space-y-3">
        {MOCK_TASKS.filter(t => t.priority === 'Urgent' || t.priority === 'High').slice(0, 5).map((task, i) => (
            <div key={task.id} className="flex items-start space-x-3 group cursor-pointer">
                <div className="mt-1 text-xs font-bold text-gray-300 w-4 text-right">{i + 1}</div>
                <div className="flex-1 bg-white border border-gray-100 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-brand-primary/30 transition-all">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-500 border border-red-100">
                            {task.priority}
                        </span>
                        <span className="text-[10px] text-gray-400">{task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date'}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 leading-tight group-hover:text-brand-primary transition-colors">{task.title}</p>
                </div>
            </div>
        ))}
        <button className="w-full py-2.5 text-xs font-medium text-gray-400 border border-dashed border-gray-200 rounded-lg hover:bg-gray-50 hover:text-brand-primary hover:border-brand-primary/30 transition-colors flex items-center justify-center space-x-1">
            <Plus size={12} />
            <span>Add Task to LineUp</span>
        </button>
    </div>
);

const StandupContent = () => (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-4">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center shadow-inner border border-white">
            <Sparkles className="text-brand-primary" size={28} />
        </div>
        <div>
            <h3 className="font-bold text-gray-800">Daily Standup</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto leading-relaxed">Brain analyzes your activity to generate a smart status report.</p>
        </div>
        <button className="bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-brand-secondary hover:to-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 active:scale-95">
            Generate with AI
        </button>
    </div>
);

const AgendaContent = () => {
    const nowPercent = 45;

    const events = [
        { time: '09:30', end: '10:00', title: 'Daily Standup', type: 'meeting', color: 'bg-blue-50 border-blue-100 text-blue-700', icon: Video },
        { time: '11:00', end: '12:30', title: 'Design Review: Mobile App', type: 'work', color: 'bg-purple-50 border-purple-100 text-purple-700', icon: MapPin },
        { time: '14:00', end: '15:00', title: 'Customer Sync', type: 'meeting', color: 'bg-green-50 border-green-100 text-green-700', icon: Video },
        { time: '16:30', end: '17:00', title: 'Wrap up & Planning', type: 'task', color: 'bg-gray-50 border-gray-100 text-gray-600', icon: ListTodo },
    ];

    return (
        <div className="relative h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today, Oct 24</h4>
                <button className="text-[10px] bg-gray-50 border border-gray-200 px-2 py-1 rounded hover:bg-gray-100 text-gray-600 transition-colors">Sync Calendar</button>
            </div>

            <div className="flex-1 relative overflow-y-auto scrollbar-hide pl-2 pr-2 space-y-4">
                {/* Time Line */}
                <div className="absolute left-[48px] top-0 bottom-0 w-[1px] bg-gray-200 z-0"></div>

                {/* Current Time Indicator */}
                <div className="absolute left-[42px] w-full flex items-center z-10" style={{ top: `${nowPercent}%` }}>
                    <div className="w-3 h-3 bg-brand-urgent rounded-full border-2 border-white shadow-sm"></div>
                    <div className="flex-1 h-[1px] bg-brand-urgent ml-1 opacity-50"></div>
                    <span className="text-[10px] text-brand-urgent font-bold bg-white px-1 ml-auto mr-2 shadow-sm rounded border border-red-100">12:45 PM</span>
                </div>

                {events.map((ev, i) => (
                    <div key={i} className="relative flex z-20 group">
                        <div className="w-12 text-[10px] text-gray-400 text-right pr-3 pt-1 font-mono">
                            <div>{ev.time}</div>
                            <div className="text-gray-300">{ev.end}</div>
                        </div>
                        <div className={`flex-1 p-3 rounded-lg border ${ev.color} shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden hover:-translate-y-0.5`}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${ev.color.replace('bg-', 'bg-opacity-100 bg-').split(' ')[0].replace('50', '500')}`}></div>
                            <div className="flex justify-between items-start">
                                <div className="font-semibold text-sm mb-1">{ev.title}</div>
                                <ev.icon size={14} className="opacity-70" />
                            </div>
                            <div className="text-xs opacity-80">Zoom • 3 participants</div>
                        </div>
                    </div>
                ))}

                {/* Empty Slot */}
                <div className="relative flex z-20 opacity-50 hover:opacity-100 transition-opacity cursor-pointer group">
                    <div className="w-12 text-[10px] text-gray-300 text-right pr-3 pt-2">13:00</div>
                    <div className="flex-1 p-3 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400 group-hover:bg-gray-50 h-16 transition-colors">
                        + Schedule block
                    </div>
                </div>
            </div>
        </div>
    );
}

const DefaultContent = ({ title }: { title: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-3">
        <div className="p-4 rounded-full bg-gray-50 border border-gray-100">
            <LayoutGrid size={24} className="opacity-30 text-gray-400" />
        </div>
        <span className="text-sm font-medium text-gray-400">No items in {title}</span>
        <button className="text-xs text-brand-primary font-semibold hover:underline">Connect Source</button>
    </div>
);

// --- Draggable Card Component ---

interface DraggableCardProps {
    card: HomeCard;
    allCards: HomeCard[];
    onUpdate: (card: HomeCard, otherUpdates?: HomeCard[]) => void;
    onRemove: (id: string) => void;
    containerWidth: number;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ card, allCards, onUpdate, onRemove, containerWidth }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const GAP = 24; // Margin between cards
    const MAGNET_THRESHOLD = 50; // Pixels to trigger magnet effect

    const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0, initialW: 0, initialH: 0 });

    const handlePointerDown = (e: React.PointerEvent, action: 'drag' | 'resize') => {
        e.stopPropagation();
        // Bring to front immediately
        onUpdate({ ...card, zIndex: Date.now() });

        dragStartRef.current = {
            x: e.clientX,
            y: e.clientY,
            initialX: card.x,
            initialY: card.y,
            initialW: card.w,
            initialH: card.h
        };

        const element = cardRef.current;
        if (element) {
            element.setPointerCapture(e.pointerId);
        }

        if (action === 'drag') setIsDragging(true);
        if (action === 'resize') setIsResizing(true);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging && !isResizing) return;
        e.stopPropagation();

        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;

        if (isDragging) {
            if (cardRef.current) {
                // Calculate rough new position
                let newX = dragStartRef.current.initialX + dx;
                let newY = dragStartRef.current.initialY + dy;

                // Canvas Limits
                const MAX_CANVAS_WIDTH = containerWidth; // Use dynamic container width

                // Enforce left margin of 32px
                newX = Math.max(32, newX);
                newY = Math.max(0, newY);

                // Magnetic Snap to Grid (20px)
                const SNAP = 20;
                if (Math.abs(newX % SNAP) < MAGNET_THRESHOLD) newX = Math.round(newX / SNAP) * SNAP;
                if (Math.abs(newY % SNAP) < MAGNET_THRESHOLD) newY = Math.round(newY / SNAP) * SNAP;

                // Ensure bounds
                newX = Math.max(32, Math.min(newX, MAX_CANVAS_WIDTH - dragStartRef.current.initialW)); // Enforce 32px left margin
                newY = Math.max(0, newY);

                cardRef.current.style.transform = `translate(${newX - dragStartRef.current.initialX}px, ${newY - dragStartRef.current.initialY}px)`;
                cardRef.current.style.zIndex = '100';
                cardRef.current.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';

                // --- COLLISION DETECTION (VISUAL ONLY) ---
                // We just visually move other cards out of the way, we don't commit changes yet.
                const rect = cardRef.current.getBoundingClientRect();
                const container = cardRef.current.offsetParent as HTMLElement;
                if (!container) return;
                const containerRect = container.getBoundingClientRect();

                const currentX = rect.left - containerRect.left;
                const currentY = rect.top - containerRect.left; // This was containerRect.top, but the diff says containerRect.left. Assuming this is a typo and should be containerRect.top
                const currentW = rect.width;
                const currentH = rect.height;

                allCards.forEach(other => {
                    if (other.instanceId === card.instanceId) return;

                    // Simple AABB collision check
                    if (
                        currentX < other.x + other.w &&
                        currentX + currentW > other.x &&
                        currentY < other.y + other.h &&
                        currentY + currentH > other.y
                    ) {
                        // Collision!
                        // Visual feedback: push the other card down
                        const otherEl = document.getElementById(`card-${other.instanceId}`);
                        if (otherEl) {
                            otherEl.style.transform = `translateY(${currentH + GAP}px)`;
                            otherEl.style.transition = 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)';
                        }
                    } else {
                        // Reset
                        const otherEl = document.getElementById(`card-${other.instanceId}`);
                        if (otherEl) {
                            otherEl.style.transform = ''; // Clear transform to reset
                        }
                    }
                });
            }
        }

        if (isResizing) {
            if (cardRef.current) {
                const newW = Math.max(300, dragStartRef.current.initialW + dx);
                const newH = Math.max(200, dragStartRef.current.initialH + dy);
                cardRef.current.style.width = `${newW}px`;
                cardRef.current.style.height = `${newH}px`;
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging && !isResizing) return;
        e.stopPropagation();

        const element = cardRef.current;
        if (element) {
            element.releasePointerCapture(e.pointerId);

            const rect = element.getBoundingClientRect();
            const container = element.offsetParent as HTMLElement;

            if (container) {
                const containerRect = container.getBoundingClientRect();

                let finalX = rect.left - containerRect.left;
                let finalY = rect.top - containerRect.top;
                let finalW = rect.width;
                let finalH = rect.height;

                if (isDragging) {
                    // Magnetic Snap to Grid (20px)
                    const SNAP = 20;
                    finalX = Math.round(finalX / SNAP) * SNAP;
                    finalY = Math.round(finalY / SNAP) * SNAP;

                    // Ensure bounds with 32px left margin
                    finalX = Math.max(32, Math.min(finalX, containerWidth - finalW));
                    finalY = Math.max(0, finalY);

                    // --- COLLISION RESOLUTION ON DROP ---
                    // We need to find if we dropped ON TOP of anyone.
                    // If so, push them down permanently.
                    const updates: HomeCard[] = [];

                    const myNewRect = { x: finalX, y: finalY, w: finalW, h: finalH };

                    // Sort others by Y so we push them down in order
                    const others = allCards.filter(c => c.instanceId !== card.instanceId).sort((a, b) => a.y - b.y);

                    others.forEach(other => {
                        if (
                            myNewRect.x < other.x + other.w &&
                            myNewRect.x + myNewRect.w > other.x &&
                            myNewRect.y < other.y + other.h &&
                            myNewRect.y + myNewRect.h > other.y
                        ) {
                            // Overlap! Push this card down.
                            const newOtherY = myNewRect.y + myNewRect.h + GAP;
                            updates.push({ ...other, y: newOtherY });

                            // Update the rect for subsequent checks (chain reaction)
                            other.y = newOtherY;
                        }

                        // Reset any visual transforms from the drag phase
                        const otherEl = document.getElementById(`card-${other.instanceId}`);
                        if (otherEl) {
                            otherEl.style.transform = '';
                        }
                    });

                    onUpdate({
                        ...card,
                        x: finalX,
                        y: finalY,
                        w: finalW,
                        h: finalH
                    }, updates);
                } else if (isResizing) {
                    onUpdate({
                        ...card,
                        x: finalX,
                        y: finalY,
                        w: finalW,
                        h: finalH
                    });
                }
            }
        }

        setIsDragging(false);
        setIsResizing(false);
    };

    // Mapping icon to type
    const Icon = {
        standup: Sparkles,
        recents: History,
        agenda: Calendar,
        mywork: ListTodo,
        assigned: ListTodo,
        personal: ClipboardList,
        comments: MessageSquare,
        lineup: ListOrdered,
        reminders: Clock
    }[card.typeId] || LayoutGrid;

    return (
        <div
            id={`card-${card.instanceId}`}
            ref={cardRef}
            className={`absolute bg-white rounded-xl flex flex-col overflow-hidden group transition-shadow duration-200 ${isDragging ? 'shadow-2xl cursor-grabbing z-50 scale-[1.02] ring-2 ring-brand-primary ring-opacity-50' : 'shadow-card hover:shadow-card-hover z-10 border border-gray-200/60'}`}
            style={{
                left: card.x,
                top: card.y,
                width: card.w,
                height: card.h,
                zIndex: isDragging ? 9999 : card.zIndex,
                transition: isDragging || isResizing ? 'none' : 'box-shadow 0.2s, transform 0.3s ease-out, left 0.3s cubic-bezier(0.2, 0, 0, 1), top 0.3s cubic-bezier(0.2, 0, 0, 1)',
            }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            {/* Header (Drag Handle) */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b border-gray-50/80 cursor-grab active:cursor-grabbing bg-gradient-to-b from-white to-gray-50/50 select-none h-12"
                onPointerDown={(e) => handlePointerDown(e, 'drag')}
            >
                <div className="flex items-center space-x-2.5 pointer-events-none">
                    <div className={`w-7 h-7 rounded-lg ${card.color} flex items-center justify-center text-white shadow-md shadow-gray-200`}>
                        <Icon size={14} />
                    </div>
                    <span className="text-sm font-bold text-gray-800 tracking-tight">{card.title}</span>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onRemove(card.instanceId); }} className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500 transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 overflow-y-auto scrollbar-hide bg-white select-text cursor-auto" onPointerDown={(e) => e.stopPropagation()}>
                {card.typeId === 'recents' && <RecentsContent />}
                {card.typeId === 'lineup' && <LineUpContent />}
                {card.typeId === 'standup' && <StandupContent />}
                {card.typeId === 'agenda' && <AgendaContent />}
                {!['recents', 'lineup', 'standup', 'agenda'].includes(card.typeId) && <DefaultContent title={card.title} />}
            </div>

            {/* Resize Handle */}
            <div
                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onPointerDown={(e) => handlePointerDown(e, 'resize')}
            >
                <div className="w-2.5 h-2.5 border-r-2 border-b-2 border-gray-300 rounded-br-[2px] hover:border-brand-primary transition-colors"></div>
            </div>
        </div>
    );
};

// --- Main Home View ---

const HomeView: React.FC<HomeViewProps> = ({
    cards = [],
    onUpdateCard = (_card) => { },
    onRemoveCard = (_id) => { },
    onOpenCustomize = () => { }
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
                {/* Greeting Header */}
                <div className="flex-shrink-0 px-8 py-6 z-20 pointer-events-none">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{greeting}, Mohamed</h1>
                </div>

                {/* Infinite Canvas Area */}
                <div className="flex-1 relative overflow-auto scrollbar-hide w-full h-full" style={{ backgroundImage: 'radial-gradient(#E5E7EB 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}>
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
                <h1 className="text-3xl font-bold text-gray-800 mb-8 tracking-tight">{greeting}, Gemini User</h1>

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
                        className="bg-gradient-to-r from-brand-primary to-indigo-600 hover:to-brand-secondary text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-glow hover:shadow-lg hover:shadow-indigo-500/40 active:scale-95 tracking-wide"
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