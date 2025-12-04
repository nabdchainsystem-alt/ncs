import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    MousePointer2,
    Hand,
    Undo2,
    Redo2,
    Minus,
    Plus,
    ChevronUp,
    Trash2,
    Move,
    Type,
    Image as ImageIcon,
    LayoutTemplate,
    ArrowUpRight,
    Pencil
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// --- Types ---

type ToolType = 'select' | 'hand' | 'task' | 'draw' | 'shape' | 'arrow' | 'note' | 'text' | 'section' | 'image' | 'template';

interface WhiteboardElement {
    id: string;
    type: ToolType;
    x: number;
    y: number;
    content?: string;
    width?: number;
    height?: number;
    points?: { x: number; y: number }[]; // For drawing
    color?: string;
    style?: any;
}

// --- Components for the "Rich" Toolbar Buttons ---

const ToolButton = ({
    active,
    onClick,
    label,
    shortcut,
    children
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    shortcut?: string;
    children: React.ReactNode
}) => (
    <div className="flex flex-col items-center gap-1 group relative">
        {shortcut && (
            <span className={`text-[10px] font-medium ${active ? 'text-blue-600' : 'text-gray-400'}`}>
                {shortcut}
            </span>
        )}
        <button
            onClick={onClick}
            className={`
                relative flex items-center justify-center
                w-10 h-10 rounded-lg transition-all duration-200
                ${active
                    ? 'bg-blue-100 ring-2 ring-blue-500 shadow-sm transform scale-105'
                    : 'hover:bg-gray-100 hover:scale-110'
                }
            `}
            title={label}
        >
            {children}
        </button>
    </div>
);

// Custom Icons to match the "Rich" look
const TaskIcon = () => (
    <div className="w-8 h-8 bg-white rounded border border-gray-200 shadow-sm flex flex-col p-1 gap-1 overflow-hidden">
        <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full border border-gray-400"></div>
            <div className="h-1 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="h-1 w-full bg-gray-100 rounded mt-auto"></div>
        <div className="h-1.5 w-6 bg-blue-500 rounded-full"></div>
    </div>
);

const NoteIcon = () => (
    <div className="w-7 h-7 bg-[#fcd34d] rounded-sm shadow-sm border-b-2 border-r-2 border-[#d97706]/20 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#fbbf24] shadow-sm transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
    </div>
);

const ShapeIcon = () => (
    <div className="w-7 h-7 bg-slate-700 rounded-sm shadow-sm"></div>
);

const SectionIcon = () => (
    <div className="w-7 h-7 border-2 border-dashed border-gray-400 rounded bg-gray-50/50 flex items-start p-0.5">
        <div className="w-2 h-1 bg-gray-300 rounded-full"></div>
    </div>
);

const ImageIconIcon = () => (
    <div className="w-7 h-7 bg-white border border-gray-200 rounded shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-100 to-purple-50"></div>
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-blue-300/50 rounded-t-lg transform translate-y-1"></div>
        <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-200 rounded-full"></div>
    </div>
);

const TemplateIcon = () => (
    <div className="w-8 h-8 relative">
        <div className="absolute top-0 right-0 w-6 h-5 bg-white border border-gray-200 rounded shadow-sm z-0 transform rotate-6"></div>
        <div className="absolute top-1 right-1 w-6 h-5 bg-white border border-gray-200 rounded shadow-sm z-10">
            <div className="flex items-center justify-center h-full gap-0.5">
                <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                <div className="w-2 h-px bg-gray-300"></div>
                <div className="w-1 h-1 bg-green-400 rounded-full"></div>
            </div>
        </div>
    </div>
);


// --- Main Component ---

const Whiteboard: React.FC = () => {
    // State
    const [activeTool, setActiveTool] = useState<ToolType>('select');
    const [zoom, setZoom] = useState(100);
    const [elements, setElements] = useState<WhiteboardElement[]>([]);
    const [history, setHistory] = useState<WhiteboardElement[][]>([[]]);
    const [historyStep, setHistoryStep] = useState(0);

    // Interaction State
    const [isDragging, setIsDragging] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [dragElementOffset, setDragElementOffset] = useState({ x: 0, y: 0 });
    const [newElementPreview, setNewElementPreview] = useState<Partial<WhiteboardElement> | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);

    // --- History Management ---
    const pushToHistory = (newElements: WhiteboardElement[]) => {
        const newHistory = history.slice(0, historyStep + 1);
        newHistory.push(newElements);
        setHistory(newHistory);
        setHistoryStep(newHistory.length - 1);
        setElements(newElements);
    };

    const undo = () => {
        if (historyStep > 0) {
            setHistoryStep(prev => prev - 1);
            setElements(history[historyStep - 1]);
        }
    };

    const redo = () => {
        if (historyStep < history.length - 1) {
            setHistoryStep(prev => prev + 1);
            setElements(history[historyStep + 1]);
        }
    };

    // --- Helpers ---
    const getMousePos = (e: React.MouseEvent) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();
        // Calculate raw position relative to container
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        // Apply zoom and pan to get "world" coordinates
        const worldX = (rawX - panOffset.x) / (zoom / 100);
        const worldY = (rawY - panOffset.y) / (zoom / 100);

        return { x: worldX, y: worldY, rawX, rawY };
    };

    // --- Event Handlers ---

    const handleMouseDown = (e: React.MouseEvent) => {
        const { x, y, rawX, rawY } = getMousePos(e);

        // Hand Tool / Middle Mouse Button -> Pan
        if (activeTool === 'hand' || e.button === 1) {
            setIsPanning(true);
            setDragStart({ x: rawX, y: rawY });
            return;
        }

        // Drawing
        if (activeTool === 'draw') {
            setIsDragging(true);
            setCurrentPath([{ x, y }]);
            return;
        }

        // Arrow / Shape / Section creation (Drag to size)
        if (['arrow', 'shape', 'section'].includes(activeTool)) {
            setIsDragging(true);
            setDragStart({ x, y });
            setNewElementPreview({
                type: activeTool,
                x,
                y,
                width: 0,
                height: 0
            });
            return;
        }

        // Click-to-place tools
        if (['note', 'text', 'task', 'image'].includes(activeTool)) {
            const id = uuidv4();
            let newEl: WhiteboardElement = {
                id,
                type: activeTool,
                x,
                y,
                width: 200,
                height: 200
            };

            if (activeTool === 'note') {
                newEl = { ...newEl, content: 'New Note', color: '#fef3c7', width: 200, height: 200 };
            } else if (activeTool === 'text') {
                newEl = { ...newEl, content: 'Type something...', width: 200, height: 50 };
            } else if (activeTool === 'task') {
                newEl = { ...newEl, content: 'New Task', width: 300, height: 140 };
            } else if (activeTool === 'image') {
                newEl = { ...newEl, width: 300, height: 200 };
            }

            pushToHistory([...elements, newEl]);
            setActiveTool('select');
            return;
        }

        // Select Tool - Deselect if clicking empty space
        if (activeTool === 'select') {
            setSelectedId(null);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const { x, y, rawX, rawY } = getMousePos(e);

        if (isPanning) {
            const dx = rawX - dragStart.x;
            const dy = rawY - dragStart.y;
            setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setDragStart({ x: rawX, y: rawY });
            return;
        }

        if (isDragging) {
            if (activeTool === 'draw') {
                setCurrentPath(prev => [...prev, { x, y }]);
            } else if (['arrow', 'shape', 'section'].includes(activeTool) && newElementPreview) {
                setNewElementPreview(prev => ({
                    ...prev,
                    width: x - (prev?.x || 0),
                    height: y - (prev?.y || 0)
                }));
            } else if (selectedId && activeTool === 'select') {
                // Moving an existing element
                setElements(prev => prev.map(el =>
                    el.id === selectedId
                        ? { ...el, x: x - dragElementOffset.x, y: y - dragElementOffset.y }
                        : el
                ));
            }
        }
    };

    const handleMouseUp = () => {
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (isDragging) {
            setIsDragging(false);

            if (activeTool === 'draw' && currentPath.length > 1) {
                const newEl: WhiteboardElement = {
                    id: uuidv4(),
                    type: 'draw',
                    x: 0,
                    y: 0,
                    points: currentPath,
                    color: '#1e293b'
                };
                pushToHistory([...elements, newEl]);
                setCurrentPath([]);
            } else if (newElementPreview) {
                // Finalize shape/arrow/section
                const newEl: WhiteboardElement = {
                    id: uuidv4(),
                    type: activeTool,
                    x: newElementPreview.x!,
                    y: newElementPreview.y!,
                    width: newElementPreview.width || 100,
                    height: newElementPreview.height || 100,
                    color: activeTool === 'shape' ? '#334155' : undefined
                };
                pushToHistory([...elements, newEl]);
                setNewElementPreview(null);
                setActiveTool('select');
            } else if (selectedId) {
                // Finished moving an element - save to history
                pushToHistory(elements);
            }
        }
    };

    const handleElementMouseDown = (e: React.MouseEvent, id: string) => {
        if (activeTool === 'select') {
            e.stopPropagation();
            const { x, y } = getMousePos(e);
            const element = elements.find(el => el.id === id);
            if (element) {
                setSelectedId(id);
                setIsDragging(true);
                setDragElementOffset({ x: x - element.x, y: y - element.y });
            }
        }
    };

    const deleteElement = (id: string) => {
        const newEls = elements.filter(el => el.id !== id);
        pushToHistory(newEls);
        setSelectedId(null);
    };

    // --- Render Helpers ---

    const renderElement = (el: WhiteboardElement) => {
        const isSelected = selectedId === el.id;
        const selectionClass = isSelected ? 'ring-2 ring-blue-500' : '';

        switch (el.type) {
            case 'note':
                return (
                    <div
                        className={`shadow-md flex items-center justify-center text-center font-handwriting text-lg leading-tight p-4 ${selectionClass}`}
                        style={{ backgroundColor: el.color, width: el.width, height: el.height }}
                    >
                        {el.content}
                    </div>
                );
            case 'text':
                return (
                    <div className={`p-2 text-gray-800 font-medium text-xl bg-transparent border border-transparent hover:border-blue-200 rounded whitespace-nowrap ${selectionClass}`}>
                        {el.content}
                    </div>
                );
            case 'task':
                return (
                    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col ${selectionClass}`} style={{ width: el.width, height: el.height }}>
                        <div className="h-1.5 bg-blue-500 w-full" />
                        <div className="p-3 flex-1 flex flex-col">
                            <div className="flex items-start justify-between mb-2">
                                <span className="text-[10px] font-medium text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded">TASK-123</span>
                                <div className="w-5 h-5 rounded-full bg-gray-200" />
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 mb-auto">{el.content}</h4>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                    <div className="w-1/2 h-full bg-green-500" />
                                </span>
                            </div>
                        </div>
                    </div>
                );
            case 'shape':
                return (
                    <div
                        className={`rounded-lg flex items-center justify-center ${selectionClass}`}
                        style={{ backgroundColor: el.color, width: Math.abs(el.width || 100), height: Math.abs(el.height || 100) }}
                    />
                );
            case 'section':
                return (
                    <div
                        className={`border-2 border-dashed border-gray-300 rounded-lg bg-gray-50/30 flex items-start p-2 ${selectionClass}`}
                        style={{ width: Math.abs(el.width || 200), height: Math.abs(el.height || 200) }}
                    >
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Section</span>
                    </div>
                );
            case 'image':
                return (
                    <div
                        className={`bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden relative ${selectionClass}`}
                        style={{ width: Math.abs(el.width || 300), height: Math.abs(el.height || 200) }}
                    >
                        <ImageIcon size={48} className="text-gray-300" />
                        <span className="absolute bottom-4 text-xs text-gray-400">Image Placeholder</span>
                    </div>
                );
            case 'arrow':
                // Simple SVG arrow rendering
                const w = el.width || 0;
                const h = el.height || 0;
                return (
                    <svg width={Math.abs(w) + 20} height={Math.abs(h) + 20} className={`overflow-visible pointer-events-none ${selectionClass}`}>
                        <defs>
                            <marker id={`arrowhead-${el.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
                            </marker>
                        </defs>
                        <line
                            x1={w > 0 ? 0 : Math.abs(w)}
                            y1={h > 0 ? 0 : Math.abs(h)}
                            x2={w > 0 ? Math.abs(w) : 0}
                            y2={h > 0 ? Math.abs(h) : 0}
                            stroke="#334155"
                            strokeWidth="2"
                            markerEnd={`url(#arrowhead-${el.id})`}
                        />
                    </svg>
                );
            default:
                return null;
        }
    };


    return (
        <div
            className="relative w-full h-full bg-[#f8fafc] overflow-hidden select-none"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Dot Grid Background */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                    backgroundSize: `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px`,
                    backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
                    opacity: 0.6,
                }}
            />

            {/* Canvas Content */}
            <div
                className="absolute inset-0 transform-origin-top-left"
                style={{
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom / 100})`
                }}
            >
                {/* SVG Layer for Drawings */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                    {elements.filter(el => el.type === 'draw').map(el => (
                        <path
                            key={el.id}
                            d={`M ${el.points?.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                            stroke={el.color}
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}
                    {isDragging && activeTool === 'draw' && (
                        <path
                            d={`M ${currentPath.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                            stroke="#1e293b"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}
                </svg>

                {/* Elements Layer */}
                {elements.map(el => {
                    if (el.type === 'draw') return null;
                    return (
                        <div
                            key={el.id}
                            className={`absolute group ${activeTool === 'select' ? 'cursor-move' : ''}`}
                            style={{
                                left: el.x,
                                top: el.y,
                                width: el.width,
                                height: el.height,
                                zIndex: selectedId === el.id ? 10 : 1
                            }}
                            onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                        >
                            {/* Delete Button (Visible on Hover/Select) */}
                            {activeTool === 'select' && (
                                <button
                                    className="absolute -top-3 -right-3 p-1.5 bg-white rounded-full shadow-sm border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity z-50 hover:bg-red-50 text-red-500"
                                    onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                            {renderElement(el)}
                        </div>
                    );
                })}

                {/* Preview Layer (for dragging new shapes) */}
                {newElementPreview && (
                    <div
                        className="absolute border-2 border-blue-400 border-dashed opacity-50 pointer-events-none"
                        style={{
                            left: Math.min(newElementPreview.x!, newElementPreview.x! + (newElementPreview.width || 0)),
                            top: Math.min(newElementPreview.y!, newElementPreview.y! + (newElementPreview.height || 0)),
                            width: Math.abs(newElementPreview.width || 0),
                            height: Math.abs(newElementPreview.height || 0),
                        }}
                    />
                )}
            </div>

            {/* --- Rich Toolbar --- */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex items-center gap-2 z-50">

                {/* Left Group: Select & Hand */}
                <div className="flex items-center gap-1 px-1">
                    <ToolButton active={activeTool === 'select'} onClick={() => setActiveTool('select')} label="Select" shortcut="V">
                        <MousePointer2 size={20} className={activeTool === 'select' ? 'text-blue-600' : 'text-gray-600'} />
                    </ToolButton>
                    <ToolButton active={activeTool === 'hand'} onClick={() => setActiveTool('hand')} label="Hand" shortcut="H">
                        <Hand size={20} className={activeTool === 'hand' ? 'text-blue-600' : 'text-gray-600'} />
                    </ToolButton>
                </div>

                <div className="w-px h-8 bg-gray-200 mx-1" />

                {/* Middle Group: Creation Tools */}
                <div className="flex items-center gap-2 px-1">
                    <ToolButton active={activeTool === 'task'} onClick={() => setActiveTool('task')} label="Task" shortcut="T">
                        <TaskIcon />
                    </ToolButton>

                    <ToolButton active={activeTool === 'draw'} onClick={() => setActiveTool('draw')} label="Draw" shortcut="D">
                        <div className="relative">
                            <Pencil size={24} className="text-gray-700" />
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-black rounded-full" />
                        </div>
                    </ToolButton>

                    <ToolButton active={activeTool === 'shape'} onClick={() => setActiveTool('shape')} label="Shape" shortcut="R">
                        <ShapeIcon />
                    </ToolButton>

                    <ToolButton active={activeTool === 'arrow'} onClick={() => setActiveTool('arrow')} label="Arrow" shortcut="A">
                        <ArrowUpRight size={26} className="text-gray-700" />
                    </ToolButton>

                    <ToolButton active={activeTool === 'note'} onClick={() => setActiveTool('note')} label="Note" shortcut="N">
                        <NoteIcon />
                    </ToolButton>

                    <ToolButton active={activeTool === 'text'} onClick={() => setActiveTool('text')} label="Text" shortcut="T">
                        <div className="w-8 h-8 bg-white border border-gray-200 rounded shadow-sm flex items-center justify-center">
                            <Type size={20} className="text-gray-800" />
                        </div>
                    </ToolButton>

                    <ToolButton active={activeTool === 'section'} onClick={() => setActiveTool('section')} label="Section" shortcut="F">
                        <SectionIcon />
                    </ToolButton>

                    <ToolButton active={activeTool === 'image'} onClick={() => setActiveTool('image')} label="Image">
                        <ImageIconIcon />
                    </ToolButton>

                    <ToolButton active={activeTool === 'template'} onClick={() => { }} label="Templates">
                        <TemplateIcon />
                    </ToolButton>
                </div>

                <div className="w-px h-8 bg-gray-200 mx-1" />

                {/* Right Group: Undo/Redo */}
                <div className="flex items-center gap-1 px-1">
                    <button
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                        onClick={undo}
                        disabled={historyStep <= 0}
                        title="Undo"
                    >
                        <Undo2 size={20} />
                    </button>
                    <button
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-30"
                        onClick={redo}
                        disabled={historyStep >= history.length - 1}
                        title="Redo"
                    >
                        <Redo2 size={20} />
                    </button>
                </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-8 left-8 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center p-1.5 z-50">
                <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                    <ChevronUp size={16} />
                </button>
                <div className="w-px h-4 bg-gray-200 mx-1" />
                <button
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                    onClick={() => setZoom(Math.max(10, zoom - 10))}
                >
                    <Minus size={16} />
                </button>
                <span className="px-3 text-xs font-semibold text-gray-600 min-w-[3.5rem] text-center">
                    {Math.round(zoom)}%
                </span>
                <button
                    className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                    onClick={() => setZoom(Math.min(200, zoom + 10))}
                >
                    <Plus size={16} />
                </button>
            </div>
        </div>
    );
};

export default Whiteboard;
