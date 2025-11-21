import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, Minus, Trash2, Square, Circle, Diamond, StickyNote, Type, Undo, Redo } from 'lucide-react';

interface MindMapNode {
    id: string;
    x: number;
    y: number;
    text: string;
    color: string;
    width: number;
    height: number;
    type: 'default' | 'circle' | 'diamond' | 'sticky' | 'text';
}

interface Edge {
    id: string;
    from: string;
    to: string;
}

interface HistoryState {
    nodes: MindMapNode[];
    edges: Edge[];
}

const COLORS = [
    { name: 'White', bg: 'bg-white', border: 'border-gray-200' },
    { name: 'Blue', bg: 'bg-blue-50', border: 'border-blue-200' },
    { name: 'Green', bg: 'bg-green-50', border: 'border-green-200' },
    { name: 'Yellow', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    { name: 'Purple', bg: 'bg-purple-50', border: 'border-purple-200' },
    { name: 'Red', bg: 'bg-red-50', border: 'border-red-200' },
];

const STICKY_COLORS = [
    { name: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-200' },
    { name: 'Blue', bg: 'bg-blue-100', border: 'border-blue-200' },
    { name: 'Green', bg: 'bg-green-100', border: 'border-green-200' },
    { name: 'Pink', bg: 'bg-pink-100', border: 'border-pink-200' },
];

const INITIAL_NODES: MindMapNode[] = [
    { id: '1', x: 0, y: 0, text: 'Central Idea', color: 'bg-white border-gray-200', width: 180, height: 60, type: 'default' }
];

const MindMapView: React.FC = () => {
    // State
    const [nodes, setNodes] = useState<MindMapNode[]>(INITIAL_NODES);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });

    // History - Initialize directly to avoid useEffect race conditions
    const [history, setHistory] = useState<HistoryState[]>([
        { nodes: INITIAL_NODES, edges: [] }
    ]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Refs for stable access in event listeners
    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);

    useEffect(() => { nodesRef.current = nodes; }, [nodes]);
    useEffect(() => { edgesRef.current = edges; }, [edges]);

    // Drag State Refs
    const dragState = useRef({
        isDraggingCanvas: false,
        dragStart: { x: 0, y: 0 },
        draggingNodeId: null as string | null,
        nodeDragOffset: { x: 0, y: 0 },
        connectingNodeId: null as string | null,
    });

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const canvasRef = useRef<HTMLDivElement>(null);
    const canvasRectRef = useRef<DOMRect | null>(null);
    const initialized = useRef(false);

    // --- Initialization: Center the View ---
    useEffect(() => {
        if (!initialized.current && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            setOffset({
                x: rect.width / 2 - 90,
                y: rect.height / 2 - 30
            });
            initialized.current = true;
        }
    }, []);

    // --- History Management ---
    const addToHistory = useCallback(() => {
        const currentNodes = nodesRef.current;
        const currentEdges = edgesRef.current;

        const newState = {
            nodes: JSON.parse(JSON.stringify(currentNodes)),
            edges: JSON.parse(JSON.stringify(currentEdges))
        };

        setHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(newState);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const addToHistoryRef = useRef(addToHistory);
    useEffect(() => { addToHistoryRef.current = addToHistory; }, [addToHistory]);

    const undo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setNodes(prevState.nodes);
            setEdges(prevState.edges);
            setHistoryIndex(historyIndex - 1);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setNodes(nextState.nodes);
            setEdges(nextState.edges);
            setHistoryIndex(historyIndex + 1);
        }
    };

    // --- Helpers ---
    const viewStateRef = useRef({ offset, scale });
    useEffect(() => { viewStateRef.current = { offset, scale }; }, [offset, scale]);

    const screenToWorld = useCallback((screenX: number, screenY: number) => {
        const rect = canvasRectRef.current || canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };

        const { offset, scale } = viewStateRef.current;
        return {
            x: (screenX - rect.left - offset.x) / scale,
            y: (screenY - rect.top - offset.y) / scale
        };
    }, []);

    // --- Global Event Listeners ---
    useEffect(() => {
        const handleWindowMouseMove = (e: MouseEvent) => {
            const state = dragState.current;
            if (!state.isDraggingCanvas && !state.draggingNodeId && !state.connectingNodeId) return;

            e.preventDefault();
            const worldPos = screenToWorld(e.clientX, e.clientY);

            if (state.connectingNodeId) {
                setMousePos(worldPos);
            }

            if (state.isDraggingCanvas) {
                setOffset({
                    x: e.clientX - state.dragStart.x,
                    y: e.clientY - state.dragStart.y,
                });
            } else if (state.draggingNodeId) {
                setNodes(prev => prev.map(node => {
                    if (node.id === state.draggingNodeId) {
                        return {
                            ...node,
                            x: worldPos.x - state.nodeDragOffset.x,
                            y: worldPos.y - state.nodeDragOffset.y
                        };
                    }
                    return node;
                }));
            }
        };

        const handleWindowMouseUp = () => {
            const state = dragState.current;

            if (state.draggingNodeId) {
                setTimeout(() => {
                    addToHistoryRef.current();
                }, 0);
            }

            state.isDraggingCanvas = false;
            state.draggingNodeId = null;
            state.connectingNodeId = null;
            setConnectingNodeId(null);
            canvasRectRef.current = null;
        };

        window.addEventListener('mousemove', handleWindowMouseMove);
        window.addEventListener('mouseup', handleWindowMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove);
            window.removeEventListener('mouseup', handleWindowMouseUp);
        };
    }, [screenToWorld]);

    // --- Event Handlers ---

    const handleMouseDown = (e: React.MouseEvent) => {
        if (canvasRef.current) {
            canvasRectRef.current = canvasRef.current.getBoundingClientRect();
        }

        if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && e.shiftKey)) {
            dragState.current.isDraggingCanvas = true;
            dragState.current.dragStart = { x: e.clientX - offset.x, y: e.clientY - offset.y };
            return;
        }
        setSelectedNodeId(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const s = Math.exp(-e.deltaY * 0.001);
            const newScale = Math.min(Math.max(0.1, scale * s), 5);

            const rect = canvasRef.current!.getBoundingClientRect();
            const worldX = (e.clientX - rect.left - offset.x) / scale;
            const worldY = (e.clientY - rect.top - offset.y) / scale;

            const newOffsetX = (e.clientX - rect.left) - worldX * newScale;
            const newOffsetY = (e.clientY - rect.top) - worldY * newScale;

            setScale(newScale);
            setOffset({ x: newOffsetX, y: newOffsetY });
        } else {
            setOffset(prev => ({
                x: prev.x - e.deltaX,
                y: prev.y - e.deltaY
            }));
        }
    };

    const addNode = (type: MindMapNode['type'] = 'default') => {
        const id = Date.now().toString();
        if (!canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const centerWorld = {
            x: (rect.left + rect.width / 2 - rect.left - offset.x) / scale,
            y: (rect.top + rect.height / 2 - rect.top - offset.y) / scale
        };

        let width = 180;
        let height = 60;
        let color = 'bg-white border-gray-200';
        let text = 'New Node';

        if (type === 'circle') { width = 120; height = 120; }
        if (type === 'diamond') { width = 140; height = 140; }
        if (type === 'sticky') {
            width = 200;
            height = 200;
            const randomColor = STICKY_COLORS[Math.floor(Math.random() * STICKY_COLORS.length)];
            color = `${randomColor.bg} ${randomColor.border}`;
            text = '';
        }
        if (type === 'text') {
            width = 200;
            height = 40;
            color = 'bg-transparent border-transparent';
            text = 'Type something...';
        }

        const newNode: MindMapNode = {
            id,
            x: centerWorld.x - width / 2,
            y: centerWorld.y - height / 2,
            text,
            color,
            width,
            height,
            type
        };

        setNodes(prev => [...prev, newNode]);
        setTimeout(() => addToHistoryRef.current(), 0);
    };

    const deleteSelected = () => {
        if (selectedNodeId) {
            setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
            setEdges(prev => prev.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId));
            setSelectedNodeId(null);
            setTimeout(() => addToHistoryRef.current(), 0);
        }
    };

    const changeColor = (colorClass: string) => {
        if (selectedNodeId) {
            setNodes(prev => prev.map(n => n.id === selectedNodeId ? { ...n, color: colorClass } : n));
            setTimeout(() => addToHistoryRef.current(), 0);
        }
    };

    const startNodeDrag = (e: React.MouseEvent, node: MindMapNode) => {
        e.stopPropagation();
        e.preventDefault();

        if (canvasRef.current) {
            canvasRectRef.current = canvasRef.current.getBoundingClientRect();
        }

        setSelectedNodeId(node.id);
        dragState.current.draggingNodeId = node.id;

        const worldPos = screenToWorld(e.clientX, e.clientY);
        dragState.current.nodeDragOffset = {
            x: worldPos.x - node.x,
            y: worldPos.y - node.y
        };
    };

    const startConnection = (e: React.MouseEvent, nodeId: string) => {
        e.stopPropagation();
        dragState.current.connectingNodeId = nodeId;
        setConnectingNodeId(nodeId);
    };

    const completeConnection = (e: React.MouseEvent, targetNodeId: string) => {
        e.stopPropagation();
        const connectingId = dragState.current.connectingNodeId;

        if (connectingId && connectingId !== targetNodeId) {
            const exists = edges.some(e => (e.from === connectingId && e.to === targetNodeId) || (e.from === targetNodeId && e.to === connectingId));
            if (!exists) {
                setEdges(prev => [...prev, {
                    id: `${connectingId}-${targetNodeId}`,
                    from: connectingId,
                    to: targetNodeId
                }]);
                setTimeout(() => addToHistoryRef.current(), 0);
            }
        }
        dragState.current.connectingNodeId = null;
        setConnectingNodeId(null);
    };

    const getNodeStyle = (node: MindMapNode) => {
        const base = `absolute flex items-center justify-center group cursor-grab active:cursor-grabbing ${node.color} `;
        const selected = selectedNodeId === node.id ? 'ring-2 ring-brand-primary ring-offset-2 shadow-xl z-30' : 'shadow-sm hover:shadow-md z-10';
        const border = node.type === 'text' ? '' : 'border';

        if (node.type === 'circle') return `${base} ${border} rounded-full aspect-square ${selected}`;
        if (node.type === 'diamond') return `${base} ${border} rotate-45 rounded-xl aspect-square ${selected}`;
        if (node.type === 'sticky') return `${base} ${border} shadow-md rounded-sm ${selected} items-start p-4`;
        if (node.type === 'text') return `${base} ${selected} justify-start px-2`;
        return `${base} ${border} rounded-xl ${selected}`;
    };

    return (
        <div className="flex-1 h-full bg-[#f8fafc] relative overflow-hidden flex flex-col font-sans">

            {/* Canvas */}
            <div
                ref={canvasRef}
                className="flex-1 relative overflow-hidden bg-[#f8fafc]"
                onMouseDown={handleMouseDown}
                onWheel={handleWheel}
                style={{ cursor: dragState.current.isDraggingCanvas ? 'grabbing' : 'default' }}
            >
                {/* Dot Grid Background */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-40"
                    style={{
                        backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                        backgroundSize: `${24 * scale}px ${24 * scale}px`,
                        backgroundPosition: `${offset.x}px ${offset.y}px`
                    }}
                ></div>

                <div
                    style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                        transformOrigin: '0 0',
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0
                    }}
                >
                    {/* Edges Layer */}
                    <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none z-0">
                        {Array.isArray(edges) && edges.map(edge => {
                            const fromNode = nodes.find(n => n.id === edge.from);
                            const toNode = nodes.find(n => n.id === edge.to);
                            if (!fromNode || !toNode) return null;

                            const start = { x: fromNode.x + fromNode.width / 2, y: fromNode.y + fromNode.height / 2 };
                            const end = { x: toNode.x + toNode.width / 2, y: toNode.y + toNode.height / 2 };

                            return (
                                <path
                                    key={edge.id}
                                    d={`M ${start.x} ${start.y} C ${start.x} ${start.y + 50}, ${end.x} ${end.y - 50}, ${end.x} ${end.y}`}
                                    stroke="#94a3b8"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            );
                        })}
                        {connectingNodeId && (() => {
                            const node = nodes.find(n => n.id === connectingNodeId);
                            if (!node) return null;

                            return (
                                <path
                                    d={`M ${node.x + node.width / 2} ${node.y + node.height / 2} L ${mousePos.x} ${mousePos.y}`}
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                    fill="none"
                                />
                            );
                        })()}
                    </svg>

                    {/* Nodes Layer */}
                    {Array.isArray(nodes) && nodes.map(node => (
                        <div
                            key={node.id}
                            className={getNodeStyle(node)}
                            style={{
                                left: node.x,
                                top: node.y,
                                width: node.width,
                                height: node.height,
                            }}
                            onMouseDown={(e) => startNodeDrag(e, node)}
                            onMouseUp={(e) => completeConnection(e, node.id)}
                        >
                            <div className={node.type === 'diamond' ? '-rotate-45 flex items-center justify-center w-full h-full' : 'w-full h-full'}>
                                <textarea
                                    value={node.text}
                                    onChange={(e) => setNodes(prev => prev.map(n => n.id === node.id ? { ...n, text: e.target.value } : n))}
                                    onBlur={() => addToHistoryRef.current()}
                                    className={`bg-transparent w-full h-full outline-none resize-none cursor-text text-gray-800 font-medium placeholder-gray-400 ${node.type === 'sticky' ? 'text-left text-lg p-2 leading-relaxed' : node.type === 'text' ? 'text-left text-xl' : 'text-center flex items-center justify-center'}`}
                                    style={{ border: 'none', padding: node.type === 'default' ? '0 10px' : undefined }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder={node.type === 'sticky' ? "Type your note..." : node.type === 'text' ? "Type text..." : "Label"}
                                />
                            </div>

                            {/* Connection Handle */}
                            {node.type !== 'text' && (
                                <div
                                    className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-crosshair hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all z-30 transform hover:scale-110 ${node.type === 'diamond' ? 'translate-x-4' : ''}`}
                                    onMouseDown={(e) => startConnection(e, node.id)}
                                >
                                    <Plus size={12} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Bar: Undo/Redo & Colors */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center space-x-4 z-50 pointer-events-none">
                <div className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-gray-200 p-1 flex items-center space-x-1 pointer-events-auto">
                    <button onClick={undo} disabled={historyIndex <= 0} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 disabled:opacity-30 transition-colors">
                        <Undo size={18} />
                    </button>
                    <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-2 hover:bg-gray-50 rounded-lg text-gray-600 disabled:opacity-30 transition-colors">
                        <Redo size={18} />
                    </button>
                </div>

                {selectedNodeId && (
                    <div className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-gray-200 p-1 flex items-center space-x-1 pointer-events-auto animate-in fade-in zoom-in duration-200">
                        {COLORS.map((c) => (
                            <button
                                key={c.name}
                                onClick={() => changeColor(`${c.bg} ${c.border}`)}
                                className={`w-6 h-6 rounded-full border border-gray-200 ${c.bg.replace('bg-', 'bg-')} hover:scale-110 transition-transform`}
                                title={c.name}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Floating Toolbar (Bottom Center) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex items-center space-x-2 z-50 animate-in slide-in-from-bottom-4 duration-300">

                <div className="flex items-center space-x-1 px-2">
                    <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors"><Minus size={18} /></button>
                    <span className="text-xs font-bold w-12 text-center text-gray-700">{Math.round(scale * 100)}%</span>
                    <button onClick={() => setScale(s => s + 0.1)} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors"><Plus size={18} /></button>
                </div>

                <div className="w-[1px] h-8 bg-gray-100"></div>

                <div className="flex items-center space-x-1 px-2">
                    <button onClick={() => addNode('default')} className="p-2.5 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-600 transition-all tooltip group relative" title="Rectangle">
                        <Square size={20} />
                    </button>
                    <button onClick={() => addNode('circle')} className="p-2.5 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-600 transition-all tooltip group relative" title="Circle">
                        <Circle size={20} />
                    </button>
                    <button onClick={() => addNode('diamond')} className="p-2.5 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-600 transition-all tooltip group relative" title="Diamond">
                        <Diamond size={20} />
                    </button>
                    <button onClick={() => addNode('sticky')} className="p-2.5 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-600 transition-all tooltip group relative" title="Sticky Note">
                        <StickyNote size={20} />
                    </button>
                    <button onClick={() => addNode('text')} className="p-2.5 hover:bg-blue-50 hover:text-blue-600 rounded-xl text-gray-600 transition-all tooltip group relative" title="Text">
                        <Type size={20} />
                    </button>
                </div>

                <div className="w-[1px] h-8 bg-gray-100"></div>

                <div className="flex items-center space-x-1 px-2">
                    <button
                        onClick={deleteSelected}
                        disabled={!selectedNodeId}
                        className={`p-2.5 rounded-xl transition-all group relative ${selectedNodeId ? 'hover:bg-red-50 text-gray-600 hover:text-red-500' : 'text-gray-300 cursor-not-allowed'}`}
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>

            {/* Hint */}
            <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-medium text-gray-400 border border-gray-100 shadow-sm pointer-events-none select-none">
                Hold Shift + Drag to pan
            </div>
        </div>
    );
};

export default MindMapView;
