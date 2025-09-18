import * as React from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { useBoard } from '../../hooks/useBoard';
import type { BoardEdge, BoardNode, BoardState, BoardViewport } from '../../types/board';
import { BOARD_SEED } from './BoardSeed';
import CardNode from './CardNode';
import LinkArrow from './LinkArrow';
import InspectorPanel from './InspectorPanel';
import Toolbar from './Toolbar';
import './BoardStyles.css';

const GRID_SIZE = 24;
const DEFAULT_NODE_WIDTH = 240;
const DEFAULT_NODE_HEIGHT = 180;
const DRAG_THROTTLE_MS = 45;
const VIRTUALIZATION_MARGIN_PX = 200;
const PLACEHOLDER_MARGIN_PX = 120;
const FPS_LOG_INTERVAL_MS = 5000;

export type BoardCanvasProps = {
  seed?: BoardState;
};

type DragState = {
  pointerId: number;
  origin: { x: number; y: number };
  nodes: { id: string; startX: number; startY: number }[];
  moved: boolean;
};

type NodeSizeMap = Record<string, { width: number; height: number }>;

type LinkFormState = {
  mode: 'create' | 'edit';
  sourceId: string;
  targetId: string;
  label: string;
  type: string;
  edgeId?: string;
  position: { x: number; y: number };
};

function clampZoom(value: number) {
  return Math.min(1.8, Math.max(0.5, value));
}

function getRefState(ref?: ReactZoomPanPinchRef | null) {
  const fallback = { positionX: 0, positionY: 0, scale: 1 };
  if (!ref || typeof ref.state !== 'object') return fallback;
  const { positionX, positionY, scale } = ref.state;
  return {
    positionX: typeof positionX === 'number' ? positionX : 0,
    positionY: typeof positionY === 'number' ? positionY : 0,
    scale: clampZoom(typeof scale === 'number' && Number.isFinite(scale) ? scale : 1),
  };
}

function previewsEqual(
  prev: Record<string, { x: number; y: number }> | null,
  next: Record<string, { x: number; y: number }>
) {
  if (prev === next) return true;
  if (!prev) return Object.keys(next).length === 0;
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return false;
  for (const key of prevKeys) {
    const prevPoint = prev[key];
    const nextPoint = next[key];
    if (!nextPoint) return false;
    if (Math.abs(prevPoint.x - nextPoint.x) > 0.4 || Math.abs(prevPoint.y - nextPoint.y) > 0.4) {
      return false;
    }
  }
  return true;
}

function snap(value: number) {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function BoardCanvas({ seed }: BoardCanvasProps) {
  const { state, actions } = useBoard({ seed: seed ?? BOARD_SEED });
  const boardRef = React.useRef<HTMLDivElement>(null);
  const controlsRef = React.useRef<ReactZoomPanPinchRef | null>(null);
  const dragStateRef = React.useRef<DragState | null>(null);
  const scaleRef = React.useRef(1);
  const lastViewportRef = React.useRef(state.viewport);
  const pendingViewportRef = React.useRef<BoardViewport | null>(null);
  const viewportRafRef = React.useRef<number>();

  const [selectedNodeIds, setSelectedNodeIds] = React.useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [linkMode, setLinkMode] = React.useState(false);
  const [linkForm, setLinkForm] = React.useState<LinkFormState | null>(null);
  const [snapToGrid, setSnapToGrid] = React.useState(true);
  const [filter, setFilter] = React.useState('All');
  const [dragPreview, setDragPreview] = React.useState<Record<string, { x: number; y: number }>>({});
  const [inspectorNodeId, setInspectorNodeId] = React.useState<string | null>(null);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [pendingLinkSource, setPendingLinkSource] = React.useState<string | null>(null);
  const [nodeSizes, setNodeSizes] = React.useState<NodeSizeMap>({});
  const [perfMode, setPerfMode] = React.useState(false);
  const [viewportSize, setViewportSize] = React.useState({ width: 0, height: 0 });

  const lastDragUpdateRef = React.useRef(0);
  const dragTimeoutRef = React.useRef<number>();
  const pendingPreviewRef = React.useRef<Record<string, { x: number; y: number }> | null>(null);
  const lastDragPreviewRef = React.useRef<Record<string, { x: number; y: number }> | null>(null);


  const nodesById = React.useMemo(() => {
    const map = new Map<string, BoardNode>();
    state.nodes.forEach((node) => {
      map.set(node.id, node);
    });
    return map;
  }, [state.nodes]);

  React.useLayoutEffect(() => {
    const updateViewportSize = () => {
      if (!boardRef.current) return;
      const next = {
        width: boardRef.current.clientWidth,
        height: boardRef.current.clientHeight,
      };
      setViewportSize((prev) => (prev.width === next.width && prev.height === next.height ? prev : next));
    };
    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  React.useEffect(() => {
    const timer = statusMessage ? window.setTimeout(() => setStatusMessage(null), 2200) : undefined;
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [statusMessage]);

  React.useEffect(() => {
    lastViewportRef.current = state.viewport;
  }, [state.viewport]);

  React.useEffect(() => () => {
    if (viewportRafRef.current) {
      window.cancelAnimationFrame(viewportRafRef.current);
      viewportRafRef.current = undefined;
    }
  }, []);

  React.useEffect(() => {
    if (!(import.meta as any)?.env?.DEV) return undefined;
    let rafId: number;
    let last = performance.now();
    let lastLog = last;
    let frames = 0;
    let accumulator = 0;
    const tick = (time: number) => {
      const delta = time - last || 16;
      last = time;
      const fps = 1000 / delta;
      accumulator += fps;
      frames += 1;
      if (time - lastLog >= FPS_LOG_INTERVAL_MS) {
        const average = accumulator / Math.max(1, frames);
        // eslint-disable-next-line no-console
        console.debug(`[Board] avg FPS ≈ ${average.toFixed(1)} (scale ${scaleRef.current.toFixed(2)})`);
        accumulator = 0;
        frames = 0;
        lastLog = time;
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const boardNodes = React.useMemo(() => {
    return state.nodes.map((node) => {
      const preview = dragPreview[node.id];
      return preview ? { ...node, ...preview } : node;
    });
  }, [state.nodes, dragPreview]);

  const viewportRect = React.useMemo(() => {
    const scale = state.viewport.zoom || 1;
    const { width, height } = viewportSize;
    if (!width || !height) {
      const left = (-state.viewport.x) / scale;
      const top = (-state.viewport.y) / scale;
      return { left, top, right: left + 1600 / scale, bottom: top + 900 / scale, scale, width: 1600, height: 900 };
    }
    const left = (-state.viewport.x) / scale;
    const top = (-state.viewport.y) / scale;
    return {
      left,
      top,
      right: left + width / scale,
      bottom: top + height / scale,
      scale,
      width,
      height,
    };
  }, [state.viewport.x, state.viewport.y, state.viewport.zoom, viewportSize.height, viewportSize.width]);

  const filteredNodeSet = React.useMemo(() => {
    if (filter === 'All') return new Set<string>();
    return new Set(
      boardNodes
        .filter((node) => node.dept === filter)
        .map((node) => node.id)
    );
  }, [boardNodes, filter]);

  const inspectorNode = inspectorNodeId ? nodesById.get(inspectorNodeId) ?? null : null;

  const virtualizationDisabled = isDragging;

  const marginPx = perfMode ? 120 : VIRTUALIZATION_MARGIN_PX;
  const placeholderPx = perfMode ? 60 : PLACEHOLDER_MARGIN_PX;
  const marginUnits = marginPx / Math.max(0.1, viewportRect.scale);
  const placeholderUnits = placeholderPx / Math.max(0.1, viewportRect.scale);

  const forcedNodeIds = React.useMemo(() => {
    const set = new Set<string>();
    selectedNodeIds.forEach((id) => set.add(id));
    if (inspectorNodeId) set.add(inspectorNodeId);
    if (pendingLinkSource) set.add(pendingLinkSource);
    if (selectedEdgeId) {
      const edge = state.edges.find((item) => item.id === selectedEdgeId);
      if (edge) {
        set.add(edge.source);
        set.add(edge.target);
      }
    }
    return set;
  }, [inspectorNodeId, pendingLinkSource, selectedEdgeId, selectedNodeIds, state.edges]);

  const visibleNodes = React.useMemo(() => {
    if (virtualizationDisabled) {
      return boardNodes.map((node) => ({
        node,
        visibility: 'full' as const,
        width: nodeSizes[node.id]?.width ?? node.width ?? DEFAULT_NODE_WIDTH,
        height: nodeSizes[node.id]?.height ?? node.height ?? DEFAULT_NODE_HEIGHT,
      }));
    }
    if (!Number.isFinite(viewportRect.left) || !Number.isFinite(viewportRect.top)) {
      return boardNodes.map((node) => ({
        node,
        visibility: 'full' as const,
        width: nodeSizes[node.id]?.width ?? node.width ?? DEFAULT_NODE_WIDTH,
        height: nodeSizes[node.id]?.height ?? node.height ?? DEFAULT_NODE_HEIGHT,
      }));
    }
    return boardNodes.map((node) => {
      const width = nodeSizes[node.id]?.width ?? node.width ?? DEFAULT_NODE_WIDTH;
      const height = nodeSizes[node.id]?.height ?? node.height ?? DEFAULT_NODE_HEIGHT;
      const bounds = {
        left: node.x,
        right: node.x + width,
        top: node.y,
        bottom: node.y + height,
      };
      const intersectsViewport =
        bounds.right >= viewportRect.left - marginUnits &&
        bounds.left <= viewportRect.right + marginUnits &&
        bounds.bottom >= viewportRect.top - marginUnits &&
        bounds.top <= viewportRect.bottom + marginUnits;
      if (forcedNodeIds.has(node.id)) {
        return { node, visibility: 'full' as const, width, height };
      }

      if (intersectsViewport) {
        return { node, visibility: 'full' as const, width, height };
      }
      const nearViewport =
        bounds.right >= viewportRect.left - placeholderUnits &&
        bounds.left <= viewportRect.right + placeholderUnits &&
        bounds.bottom >= viewportRect.top - placeholderUnits &&
        bounds.top <= viewportRect.bottom + placeholderUnits;
      if (nearViewport) {
        return { node, visibility: 'placeholder' as const, width, height };
      }
      return { node, visibility: 'hidden' as const, width, height };
    });
  }, [boardNodes, forcedNodeIds, marginUnits, nodeSizes, placeholderUnits, virtualizationDisabled, viewportRect]);

  const visibilityByNodeId = React.useMemo(() => {
    const map = new Map<string, 'full' | 'placeholder' | 'hidden'>();
    visibleNodes.forEach(({ node, visibility }) => {
      map.set(node.id, visibility);
    });
    return map;
  }, [visibleNodes]);

  const owners = React.useMemo(() => {
    const unique = new Map<string, { id: string; name: string }>();
    state.nodes.forEach((node) => {
      if (node.owner) {
        unique.set(node.owner, { id: node.owner, name: node.owner });
      }
    });
    return Array.from(unique.values());
  }, [state.nodes]);

  const linkedNodes = React.useMemo(() => {
    if (!inspectorNode) return [];
    const relatedIds = new Set<string>();
    state.edges.forEach((edge) => {
      if (edge.source === inspectorNode.id) relatedIds.add(edge.target);
      if (edge.target === inspectorNode.id) relatedIds.add(edge.source);
    });
    return state.nodes.filter((node) => relatedIds.has(node.id));
  }, [inspectorNode, state.edges, state.nodes]);

  const hideAllEdges = !virtualizationDisabled && (perfMode || viewportRect.scale < 0.15);
  const hideEdgeDetails = !virtualizationDisabled && (perfMode || viewportRect.scale < 0.25);

  const pushViewportUpdate = React.useCallback(
    (next: BoardViewport) => {
      const EPS = 0.35;
      const scaleEPS = 0.001;
      const prev = lastViewportRef.current;
      if (
        Math.abs(next.x - prev.x) < EPS &&
        Math.abs(next.y - prev.y) < EPS &&
        Math.abs(next.zoom - prev.zoom) < scaleEPS
      ) {
        return;
      }
      pendingViewportRef.current = next;
      if (viewportRafRef.current) return;
      viewportRafRef.current = window.requestAnimationFrame(() => {
        viewportRafRef.current = undefined;
        const pending = pendingViewportRef.current;
        pendingViewportRef.current = null;
        if (!pending) return;
        const latest = lastViewportRef.current;
        if (
          Math.abs(pending.x - latest.x) < EPS &&
          Math.abs(pending.y - latest.y) < EPS &&
          Math.abs(pending.zoom - latest.zoom) < scaleEPS
        ) {
          return;
        }
        actions.setViewport(pending);
      });
    },
    [actions]
  );

  const handleTransformUpdate = React.useCallback(
    (ref: ReactZoomPanPinchRef, values?: { scale?: number; positionX?: number; positionY?: number }) => {
      controlsRef.current = ref;
      const base = getRefState(ref);
      const scale = clampZoom(values?.scale ?? base.scale ?? scaleRef.current ?? 1);
      const positionX = values?.positionX ?? base.positionX ?? lastViewportRef.current.x;
      const positionY = values?.positionY ?? base.positionY ?? lastViewportRef.current.y;
      scaleRef.current = scale;
      pushViewportUpdate({ x: positionX, y: positionY, zoom: scale });
      // TODO: broadcast viewport changes via realtime channel for multi-user sessions.
    },
    [pushViewportUpdate]
  );

  const commitDragPreview = React.useCallback((nextPreview: Record<string, { x: number; y: number }>) => {
    if (previewsEqual(lastDragPreviewRef.current, nextPreview)) {
      return;
    }
    lastDragPreviewRef.current = nextPreview;
    setDragPreview(nextPreview);
    lastDragUpdateRef.current = performance.now();
    pendingPreviewRef.current = null;
  }, []);

  const scheduleDragPreview = React.useCallback(
    (nextPreview: Record<string, { x: number; y: number }>) => {
      const now = performance.now();
      if (now - lastDragUpdateRef.current >= DRAG_THROTTLE_MS) {
        commitDragPreview(nextPreview);
        return;
      }
      pendingPreviewRef.current = nextPreview;
      if (!dragTimeoutRef.current) {
        const delay = Math.max(8, DRAG_THROTTLE_MS - (now - lastDragUpdateRef.current));
        dragTimeoutRef.current = window.setTimeout(() => {
          dragTimeoutRef.current = undefined;
          if (pendingPreviewRef.current && !previewsEqual(lastDragPreviewRef.current, pendingPreviewRef.current)) {
            commitDragPreview(pendingPreviewRef.current);
          }
        }, delay);
      }
    },
    [commitDragPreview]
  );

  const clearSelections = React.useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setPendingLinkSource(null);
  }, []);

  const handleNodePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>, node: BoardNode) => {
      if (linkMode) {
        if (!pendingLinkSource) {
          setPendingLinkSource(node.id);
          setSelectedNodeIds([node.id]);
          setStatusMessage('Select a target node to create a link');
        } else if (pendingLinkSource === node.id) {
          setPendingLinkSource(null);
          setSelectedNodeIds([]);
        } else {
          const sourceNode = nodesById.get(pendingLinkSource);
          if (!sourceNode) return;
          const sourceSize = nodeSizes[pendingLinkSource];
          const targetSize = nodeSizes[node.id];
          const position = computeMidpoint(sourceNode, node, sourceSize, targetSize);
          setLinkForm({
            mode: 'create',
            sourceId: pendingLinkSource,
            targetId: node.id,
            label: '',
            type: 'dependency',
            position,
          });
          setPendingLinkSource(null);
        }
        return;
      }

      const multi = event.shiftKey;
      let selection = selectedNodeIds;
      if (multi) {
        if (selection.includes(node.id)) {
          selection = selection.filter((id) => id !== node.id);
        } else {
          selection = [...selection, node.id];
        }
      } else if (!selection.includes(node.id)) {
        selection = [node.id];
      }
      if (!selection.length) selection = [node.id];
      setSelectedNodeIds(selection);
      setSelectedEdgeId(null);

      const nodesForDrag = selection.map((id) => {
        const n = nodesById.get(id);
        return n ? { id, startX: n.x, startY: n.y } : null;
      }).filter(Boolean) as DragState['nodes'];
      dragStateRef.current = {
        pointerId: event.pointerId,
        origin: { x: event.clientX, y: event.clientY },
        nodes: nodesForDrag,
        moved: false,
      };
      setIsDragging(true);
    },
    [linkMode, pendingLinkSource, nodesById, nodeSizes, selectedNodeIds]
  );

  const handleNodePointerMove = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState) return;
    const scale = scaleRef.current || 1;
    const dx = (event.clientX - dragState.origin.x) / scale;
    const dy = (event.clientY - dragState.origin.y) / scale;

    if (!dragState.moved && Math.abs(dx) + Math.abs(dy) > 3) {
      dragState.moved = true;
    }

    let snappedDx = dx;
    let snappedDy = dy;
    if (snapToGrid) {
      snappedDx = snap(dx);
      snappedDy = snap(dy);
    }

    const preview: Record<string, { x: number; y: number }> = {};
    dragState.nodes.forEach(({ id, startX, startY }) => {
      preview[id] = { x: startX + snappedDx, y: startY + snappedDy };
    });
    scheduleDragPreview(preview);
  }, [scheduleDragPreview, snapToGrid]);

  const handleNodePointerUp = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    dragStateRef.current = null;
    setIsDragging(false);
    if (!dragState) return;

    const scale = scaleRef.current || 1;
    const dx = (event.clientX - dragState.origin.x) / scale;
    const dy = (event.clientY - dragState.origin.y) / scale;

    let snappedDx = dx;
    let snappedDy = dy;
    if (snapToGrid) {
      snappedDx = snap(dx);
      snappedDy = snap(dy);
    }

    if (dragState.moved) {
      const ids = dragState.nodes.map((node) => node.id);
      actions.moveNodes(ids, { x: snappedDx, y: snappedDy }, { historySummary: `Moved ${ids.length} card(s)` });
    }
    commitDragPreview({});
    lastDragPreviewRef.current = {};
    if (dragTimeoutRef.current) {
      window.clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = undefined;
      pendingPreviewRef.current = null;
    }
  }, [actions, commitDragPreview, snapToGrid]);

  const handleZoom = React.useCallback((direction: 'in' | 'out') => {
    const ref = controlsRef.current;
    if (!ref) return;
    if (direction === 'in') {
      ref.zoomIn(0.2);
    } else {
      ref.zoomOut(0.2);
    }
  }, []);

  const handleAddNode = React.useCallback(() => {
    const ref = controlsRef.current;
    const wrapper = boardRef.current;
    let x = 0;
    let y = 0;
    if (ref && wrapper) {
      const rect = wrapper.getBoundingClientRect();
      const { positionX, positionY, scale } = getRefState(ref);
      x = (rect.width / 2 - positionX) / scale - 120;
      y = (rect.height / 2 - positionY) / scale - 80;
    }
    if (snapToGrid) {
      x = snap(x);
      y = snap(y);
    }
    const newNode: BoardNode = {
      id: createId('node'),
      title: 'New Card',
      body: 'Describe the next step and context for collaborators.',
      owner: '',
      dueDate: '',
      status: 'Draft',
      dept: 'General',
      x,
      y,
    };
    actions.addNode(newNode);
    setSelectedNodeIds([newNode.id]);
    setInspectorNodeId(newNode.id);
  }, [actions, snapToGrid]);

  const handleKeydown = React.useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setInspectorNodeId(null);
        clearSelections();
        setLinkMode(false);
        setLinkForm(null);
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodeIds.length) {
          selectedNodeIds.forEach((id) => actions.removeNode(id));
          setStatusMessage('Node deleted');
          clearSelections();
        } else if (selectedEdgeId) {
          actions.removeEdge(selectedEdgeId);
          setStatusMessage('Link deleted');
          setSelectedEdgeId(null);
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        actions.save();
        setStatusMessage('Layout saved');
      }
      if (!event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'l') {
        setLinkMode((prev) => !prev);
      }
      if (!event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'a') {
        handleAddNode();
      }
    },
    [actions, clearSelections, handleAddNode, selectedEdgeId, selectedNodeIds]
  );

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  React.useEffect(() => () => {
    if (dragTimeoutRef.current) {
      window.clearTimeout(dragTimeoutRef.current);
      dragTimeoutRef.current = undefined;
    }
  }, []);

  const handleLinkEdit = (edgeId: string) => {
    const edge = state.edges.find((item) => item.id === edgeId);
    if (!edge) return;
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (!source || !target) return;
    const position = computeMidpoint(source, target, nodeSizes[source.id], nodeSizes[target.id]);
    setLinkForm({
      mode: 'edit',
      edgeId: edge.id,
      sourceId: edge.source,
      targetId: edge.target,
      label: edge.label ?? '',
      type: edge.type ?? 'dependency',
      position,
    });
  };

  const handleLinkDelete = (edgeId: string) => {
    const edge = state.edges.find((item) => item.id === edgeId);
    actions.removeEdge(edgeId);
    if (selectedEdgeId === edgeId) {
      setSelectedEdgeId(null);
    }
    if (edge) {
      const source = nodesById.get(edge.source);
      const target = nodesById.get(edge.target);
      if (source && target) {
        actions.updateNode(source.id, {}, { historySummary: `Link removed → ${target.title}`, historyType: 'link' });
        actions.updateNode(target.id, {}, { historySummary: `Link removed ← ${source.title}`, historyType: 'link' });
      }
    }
  };

  const handleLinkSubmit = (payload: { label: string; type: string }) => {
    if (!linkForm) return;
    const source = nodesById.get(linkForm.sourceId);
    const target = nodesById.get(linkForm.targetId);
    if (linkForm.mode === 'create') {
      const id = createId('edge');
      const edge: BoardEdge = {
        id,
        source: linkForm.sourceId,
        target: linkForm.targetId,
        label: payload.label,
        type: payload.type,
      };
      actions.addEdge(edge);
      setSelectedEdgeId(id);
      if (source && target) {
        actions.updateNode(source.id, {}, { historySummary: `Linked to ${target.title}`, historyType: 'link' });
        actions.updateNode(target.id, {}, { historySummary: `Linked from ${source.title}`, historyType: 'link' });
      }
    } else if (linkForm.mode === 'edit' && linkForm.edgeId) {
      actions.updateEdge(linkForm.edgeId, { label: payload.label, type: payload.type });
      if (source && target) {
        actions.updateNode(source.id, {}, { historySummary: `Link updated with ${target.title}`, historyType: 'link' });
      }
    }
    setLinkForm(null);
    setLinkMode(false);
  };

  const handleImport = (text: string) => {
    const { state: imported, error } = actions.importJSON(text);
    if (error || !imported) {
      setStatusMessage('Import failed — invalid format');
    } else {
      setStatusMessage('Board imported');
    }
  };

  const handleSizeChange = (id: string, size: { width: number; height: number }) => {
    setNodeSizes((prev) => {
      if (prev[id] && prev[id].width === size.width && prev[id].height === size.height) return prev;
      return { ...prev, [id]: size };
    });
  };

  const handleComment = (id: string) => {
    const node = nodesById.get(id);
    if (!node) return;
    const message = window.prompt('Add comment for this card');
    if (!message) return;
    const existing = Array.isArray(node.metadata?.comments) ? [...(node.metadata?.comments as any[])] : [];
    const comments = [{ id: createId('c'), message, user: 'You', timestamp: Date.now() }, ...existing];
    const metadata = {
      ...(node.metadata ?? {}),
      comments,
    };
    actions.updateNode(id, {
      metadata,
    }, { historySummary: 'Comment added', historyType: 'edit' });
    setStatusMessage('Comment added');
  };

  const handleNodeKeyMove = (id: string, delta: { x: number; y: number }) => {
    const node = nodesById.get(id);
    if (!node) return;
    const x = snapToGrid ? snap(node.x + delta.x) : node.x + delta.x;
    const y = snapToGrid ? snap(node.y + delta.y) : node.y + delta.y;
    actions.moveNode(id, { x, y }, { historySummary: 'Keyboard move' });
  };

  const handleSaveInspector = (updates: Partial<BoardNode>) => {
    if (!inspectorNode) return;
    actions.updateNode(inspectorNode.id, updates, { historySummary: 'Details updated' });
    setStatusMessage('Card updated');
  };

  const handleNavigateToNode = (id: string) => {
    setInspectorNodeId(id);
    setSelectedNodeIds([id]);
    const ref = controlsRef.current;
    const node = nodesById.get(id);
    if (ref && node) {
      const instance = (ref.instance as any) ?? {};
      const wrapperWidth = instance.wrapperComponent?.offsetWidth ?? boardRef.current?.clientWidth ?? 0;
      const wrapperHeight = instance.wrapperComponent?.offsetHeight ?? boardRef.current?.clientHeight ?? 0;
      const { scale: zoom } = getRefState(ref);
      const targetX = -node.x * zoom + wrapperWidth / 2 - 120 * zoom;
      const targetY = -node.y * zoom + wrapperHeight / 2 - 80 * zoom;
      ref.setTransform(targetX, targetY, zoom, 200, 'easeOut');
      handleTransformUpdate(ref, { scale: zoom, positionX: targetX, positionY: targetY });
    }
  };

  const visibleEdges = React.useMemo(() => {
    const results: Array<{
      edge: BoardEdge;
      source: BoardNode;
      target: BoardNode;
      sourceSize: { width: number; height: number };
      targetSize: { width: number; height: number };
      index: number;
      showLabel: boolean;
      showArrowhead: boolean;
    }> = [];
    const { left, right, top, bottom } = viewportRect;

    state.edges.forEach((edge, index) => {
      const source = nodesById.get(edge.source);
      const target = nodesById.get(edge.target);
      if (!source || !target) return;

      const sourceSize = nodeSizes[source.id] ?? { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };
      const targetSize = nodeSizes[target.id] ?? { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };

      const isSelectedEdge = edge.id === selectedEdgeId;
      if (hideAllEdges && !isSelectedEdge) {
        return;
      }

      const sourceVisibility = visibilityByNodeId.get(source.id) ?? 'hidden';
      const targetVisibility = visibilityByNodeId.get(target.id) ?? 'hidden';
      if (!isSelectedEdge && sourceVisibility === 'hidden' && targetVisibility === 'hidden') {
        return;
      }

      const sourceCenter = {
        x: source.x + sourceSize.width / 2,
        y: source.y + sourceSize.height / 2,
      };
      const targetCenter = {
        x: target.x + targetSize.width / 2,
        y: target.y + targetSize.height / 2,
      };

      const minX = Math.min(sourceCenter.x, targetCenter.x);
      const maxX = Math.max(sourceCenter.x, targetCenter.x);
      const minY = Math.min(sourceCenter.y, targetCenter.y);
      const maxY = Math.max(sourceCenter.y, targetCenter.y);
      const intersectsViewport =
        maxX >= left - marginUnits &&
        minX <= right + marginUnits &&
        maxY >= top - marginUnits &&
        minY <= bottom + marginUnits;

      if (!intersectsViewport && !isSelectedEdge) {
        return;
      }

      const showDetail = !hideEdgeDetails || isSelectedEdge;
      results.push({
        edge,
        source,
        target,
        sourceSize,
        targetSize,
        index,
        showLabel: showDetail,
        showArrowhead: showDetail,
      });
    });
    return results;
  }, [hideAllEdges, hideEdgeDetails, marginUnits, nodesById, nodeSizes, selectedEdgeId, state.edges, visibilityByNodeId, viewportRect]);

  return (
    <div className="board-shell" ref={boardRef}>
      <Toolbar
        filter={filter}
        linkMode={linkMode}
        snapToGrid={snapToGrid}
        perfMode={perfMode}
        onAddCard={handleAddNode}
        onToggleLinkMode={() => {
          setLinkMode((prev) => !prev);
          setPendingLinkSource(null);
          setLinkForm(null);
        }}
        onSave={() => {
          actions.save();
          setStatusMessage('Layout saved');
        }}
        onExport={() => actions.exportJSON()}
        onImport={handleImport}
        onReset={() => {
          actions.resetToSeed();
          clearSelections();
          setLinkMode(false);
          setStatusMessage('Seed restored');
        }}
        onZoomIn={() => handleZoom('in')}
        onZoomOut={() => handleZoom('out')}
        onArrange={() => {
          actions.arrange();
          setStatusMessage('Cards arranged');
        }}
        onFilterChange={setFilter}
        onToggleSnap={() => setSnapToGrid((prev) => !prev)}
        onTogglePerf={() => setPerfMode((prev) => !prev)}
        onShowHelp={() => setHelpOpen(true)}
      />
      <div
        className={`board-stage ${isDragging ? 'cursor-grabbing' : ''}`}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            clearSelections();
          }
        }}
      >
        <TransformWrapper
          initialScale={state.viewport.zoom}
          initialPositionX={state.viewport.x}
          initialPositionY={state.viewport.y}
          minScale={0.4}
          maxScale={2.2}
          centerOnInit
          wheel={{ step: 0.08, activationKeys: ['Meta', 'Control'] }}
          doubleClick={{ disabled: true }}
          panning={{
            disabled: false,
            wheelPanning: false,
            activationKeys: [' '],
            velocityDisabled: true,
            allowMiddleClickPan: true,
          }}
          velocityAnimation={{ disabled: true }}
          pinch={{ step: 5 }}
          zoomAnimation={{ animationType: 'easeOut', animationTime: 150 }}
          onInit={(ref) => {
            controlsRef.current = ref;
            const base = getRefState(ref);
            scaleRef.current = base.scale;
            pushViewportUpdate({ x: base.positionX, y: base.positionY, zoom: base.scale });
          }}
          onTransformed={(ref, state) => handleTransformUpdate(ref, state)}
          onZoom={(ref) => handleTransformUpdate(ref)}
          onPanning={(ref) => handleTransformUpdate(ref)}
        >
          <TransformComponent>
            <div
              role="application"
              aria-label="Collaboration board canvas"
              tabIndex={0}
              className={`board-grid ${isDragging ? 'is-dragging' : ''} ${linkMode ? 'is-linking' : ''}`}
              style={{ width: '2000px', height: '1400px' }}
            >
              <svg className="absolute inset-0" width="2000" height="1400">
                {visibleEdges.map((entry) => {
                  const { edge, source, target, sourceSize, targetSize, index, showLabel, showArrowhead } = entry;
                  const isSelected = selectedEdgeId === edge.id;
                  return (
                  <LinkArrow
                    key={edge.id}
                    edge={edge}
                    source={source}
                    target={target}
                    sourceSize={sourceSize}
                    targetSize={targetSize}
                    index={index}
                    selected={isSelected}
                    zoom={viewportRect.scale}
                    showLabel={showLabel}
                    showArrowhead={showArrowhead}
                    perfMode={perfMode}
                    freezeLabel={isDragging}
                    onSelect={(id) => {
                      setSelectedEdgeId(id);
                      setSelectedNodeIds([]);
                    }}
                    onEdit={handleLinkEdit}
                      onDelete={handleLinkDelete}
                    />
                  );
                })}
              </svg>
              {visibleNodes.map(({ node, visibility, width, height }) => {
                if (visibility === 'hidden') return null;
                if (visibility === 'placeholder') {
                  return (
                    <div
                      key={`placeholder-${node.id}`}
                      className="board-node-placeholder"
                      style={{
                        transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                        width,
                        height,
                      }}
                    />
                  );
                }
                return (
                  <CardNode
                    key={node.id}
                    node={node}
                    selected={selectedNodeIds.includes(node.id)}
                    dimmed={filter !== 'All' && !filteredNodeSet.has(node.id)}
                    linkMode={linkMode}
                    isDragging={isDragging && selectedNodeIds.includes(node.id)}
                    style={{ width, height }}
                    onPointerDown={handleNodePointerDown}
                    onPointerMove={handleNodePointerMove}
                    onPointerUp={handleNodePointerUp}
                    onKeyMove={handleNodeKeyMove}
                    onDelete={(id) => actions.removeNode(id)}
                    onEnter={(id) => {
                      setInspectorNodeId(id);
                      setSelectedNodeIds([id]);
                    }}
                    onRequestLink={(id) => {
                      setLinkMode(true);
                      setPendingLinkSource(id);
                      setSelectedNodeIds([id]);
                    }}
                    onComment={handleComment}
                    onFocusChange={(id, focused) => {
                      if (focused) {
                        setSelectedNodeIds((prev) => (prev.includes(id) ? prev : [id]));
                      }
                    }}
                    onSizeChange={handleSizeChange}
                  />
                );
              })}
              {linkForm ? (
                <div
                  className="board-mini-modal absolute z-30 flex w-60 flex-col gap-2 px-4 py-3 text-xs"
                  style={{
                    left: linkForm.position.x,
                    top: linkForm.position.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <h4 className="text-sm font-semibold text-gray-700">
                    {linkForm.mode === 'create' ? 'Create link' : 'Edit link'}
                  </h4>
                  <label className="flex flex-col gap-1 text-xs text-gray-500">
                    Label
                    <input
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none"
                      value={linkForm.label}
                      onChange={(event) => setLinkForm((prev) => (prev ? { ...prev, label: event.target.value } : prev))}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-gray-500">
                    Type
                    <input
                      className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none"
                      value={linkForm.type}
                      onChange={(event) => setLinkForm((prev) => (prev ? { ...prev, type: event.target.value } : prev))}
                    />
                  </label>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-md border border-gray-200 px-3 py-1 text-xs text-gray-600"
                      onClick={() => setLinkForm(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-primary-600 px-3 py-1 text-xs font-semibold text-white"
                      onClick={() => handleLinkSubmit({ label: linkForm.label, type: linkForm.type })}
                    >
                      {linkForm.mode === 'create' ? 'Create' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
      <InspectorPanel
        open={Boolean(inspectorNode)}
        node={inspectorNode ?? null}
        linkedNodes={linkedNodes}
        onClose={() => setInspectorNodeId(null)}
        onSave={handleSaveInspector}
        onNavigateToNode={handleNavigateToNode}
        owners={owners}
      />
      {helpOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setHelpOpen(false)} />
          <div className="board-mini-modal relative z-10 w-[420px] space-y-3 px-6 py-5 text-sm text-gray-600">
            <h3 className="text-base font-semibold text-gray-800">Board shortcuts</h3>
            <ul className="space-y-1 text-xs">
              <li><span className="font-semibold">A</span> — Add Card</li>
              <li><span className="font-semibold">L</span> — Toggle Link Mode</li>
              <li><span className="font-semibold">Ctrl/Cmd + S</span> — Save Layout</li>
              <li><span className="font-semibold">Esc</span> — Clear selection / close inspector</li>
              <li><span className="font-semibold">Delete</span> — Remove selected card or link</li>
              <li><span className="font-semibold">Arrow Keys</span> — Nudge focused card 4px</li>
              <li><span className="font-semibold">Shift + Arrow Keys</span> — Nudge focused card 10px</li>
              <li><span className="font-semibold">Ctrl/Cmd + Arrow Keys</span> — Nudge focused card 20px</li>
              <li><span className="font-semibold">Space + drag</span> or <span className="font-semibold">Middle drag</span> — Pan canvas</li>
              <li><span className="font-semibold">Ctrl/Cmd + scroll</span> — Zoom canvas</li>
            </ul>
            <div className="text-xs text-gray-500">
              TODO: replace localStorage persistence with /api/boards/:id and add realtime sync.
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="rounded-md bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white"
                onClick={() => setHelpOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {statusMessage ? (
        <div className="pointer-events-none fixed bottom-6 right-6 z-30 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          {statusMessage}
        </div>
      ) : null}
    </div>
  );
}

function computeMidpoint(
  source: BoardNode,
  target: BoardNode,
  sourceSize?: { width: number; height: number },
  targetSize?: { width: number; height: number }
): { x: number; y: number } {
  const srcWidth = sourceSize?.width ?? 240;
  const srcHeight = sourceSize?.height ?? 180;
  const tgtWidth = targetSize?.width ?? 240;
  const tgtHeight = targetSize?.height ?? 180;
  const centerA = { x: source.x + srcWidth / 2, y: source.y + srcHeight / 2 };
  const centerB = { x: target.x + tgtWidth / 2, y: target.y + tgtHeight / 2 };
  return {
    x: (centerA.x + centerB.x) / 2,
    y: (centerA.y + centerB.y) / 2 - 40,
  };
}

export default BoardCanvas;
