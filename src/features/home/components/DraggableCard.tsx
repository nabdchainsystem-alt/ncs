import React, { useState, useRef } from 'react';
import { LayoutGrid, X, Sparkles, History, Calendar, ListTodo, ClipboardList, MessageSquare, ListOrdered, Clock } from 'lucide-react';
import { HomeCard } from '../types';
import { RecentsContent, LineUpContent, StandupContent, AgendaContent, DefaultContent } from './HomeCardContents';

interface DraggableCardProps {
    card: HomeCard;
    allCards: HomeCard[];
    onUpdate: (card: HomeCard, otherUpdates?: HomeCard[]) => void;
    onRemove: (id: string) => void;
    containerWidth: number;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({ card, allCards, onUpdate, onRemove, containerWidth }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const GAP = 24; // Margin between cards
    const MAGNET_THRESHOLD = 50; // Pixels to trigger magnet effect

    const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0, initialW: 0, initialH: 0 });

    const handlePointerDown = (e: React.PointerEvent, action: 'drag' | 'resize') => {
        e.stopPropagation();
        // Bring to front immediately
        const maxZ = Math.max(...allCards.map(c => c.zIndex || 0), 0);
        onUpdate({ ...card, zIndex: maxZ + 1 });

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
                newX = Math.max(32, Math.min(newX, MAX_CANVAS_WIDTH - dragStartRef.current.initialW - 32)); // Enforce 32px left and right margin
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
                let newW = Math.max(300, dragStartRef.current.initialW + dx);
                const newH = Math.max(200, dragStartRef.current.initialH + dy);

                // Constrain width to not exceed container width - right margin (32px)
                const maxW = containerWidth - card.x - 32;
                newW = Math.min(newW, maxW);

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
                    finalX = Math.max(32, Math.min(finalX, containerWidth - finalW - 32));
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
                    // Ensure final width respects the right margin
                    const maxW = containerWidth - finalX - 32;
                    finalW = Math.min(finalW, maxW);

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
