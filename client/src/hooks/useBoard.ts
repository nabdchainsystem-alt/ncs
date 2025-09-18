import * as React from 'react';
import { BOARD_SEED } from '../components/board/BoardSeed';
import type { BoardEdge, BoardHistoryEntry, BoardNode, BoardState, BoardViewport } from '../types/board';

const STORAGE_KEY = 'ncs_board_v1';
const PERSIST_DELAY = 400;

type UseBoardOptions = {
  seed?: BoardState;
  storageKey?: string;
  onChange?: (state: BoardState) => void;
};

type ImportResult = {
  state: BoardState | null;
  error?: Error;
};

type BoardActions = {
  addNode: (node: BoardNode) => void;
  updateNode: (id: string, updates: Partial<BoardNode>, options?: { historySummary?: string }) => void;
  removeNode: (id: string) => void;
  moveNode: (id: string, position: { x: number; y: number }, options?: { historySummary?: string }) => void;
  moveNodes: (ids: string[], delta: { x: number; y: number }, options?: { historySummary?: string }) => void;
  addEdge: (edge: BoardEdge) => void;
  updateEdge: (id: string, updates: Partial<BoardEdge>) => void;
  removeEdge: (id: string) => void;
  setViewport: (viewport: BoardViewport) => void;
  save: () => void;
  load: (payload?: BoardState) => void;
  exportJSON: () => string;
  importJSON: (payload: string) => ImportResult;
  resetToSeed: () => void;
  arrange: () => void;
};

type UseBoardReturn = {
  state: BoardState;
  actions: BoardActions;
};

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function cloneState<T>(value: T): T {
  // structuredClone is supported in modern browsers; fallback keeps tests happy.
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function loadFromStorage(key: string): BoardState | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeState(parsed as BoardState);
  } catch (error) {
    console.warn('[Board] Failed to parse stored board state', error);
    return null;
  }
}

function saveToStorage(key: string, state: BoardState) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.warn('[Board] Failed to persist board state', error);
  }
}

function normalizeState(input: BoardState | undefined | null): BoardState {
  if (!input) return cloneState(BOARD_SEED);
  const viewport = input.viewport ?? { x: 0, y: 0, zoom: 1 };
  return {
    nodes: Array.isArray(input.nodes) ? input.nodes.map(normalizeNode) : [],
    edges: Array.isArray(input.edges) ? input.edges.map(normalizeEdge) : [],
    viewport: {
      x: typeof viewport.x === 'number' ? viewport.x : 0,
      y: typeof viewport.y === 'number' ? viewport.y : 0,
      zoom: typeof viewport.zoom === 'number' ? viewport.zoom : 1,
    },
    lastUpdated: input.lastUpdated ?? Date.now(),
  };
}

function normalizeNode(node: BoardNode): BoardNode {
  return {
    ...node,
    x: typeof node.x === 'number' ? node.x : 0,
    y: typeof node.y === 'number' ? node.y : 0,
    history: Array.isArray(node.history) ? node.history.map(normalizeHistoryEntry) : [],
  };
}

function normalizeEdge(edge: BoardEdge): BoardEdge {
  return {
    ...edge,
  };
}

function normalizeHistoryEntry(entry: BoardHistoryEntry): BoardHistoryEntry {
  return {
    ...entry,
    id: entry.id || `hist-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: entry.timestamp ?? Date.now(),
  };
}

function appendHistory(node: BoardNode, entry: BoardHistoryEntry): BoardNode {
  const history = node.history ? [...node.history] : [];
  history.unshift({ ...entry, id: entry.id || `h-${Date.now()}` });
  return {
    ...node,
    history: history.slice(0, 32),
  };
}

function createHistoryEntry(type: BoardHistoryEntry['type'], summary: string): BoardHistoryEntry {
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    summary,
    timestamp: Date.now(),
  };
}

function simpleArrange(nodes: BoardNode[]): BoardNode[] {
  if (!nodes.length) return nodes;
  const sorted = [...nodes].sort((a, b) => a.title.localeCompare(b.title));
  const perRow = Math.ceil(Math.sqrt(sorted.length));
  const spacingX = 260;
  const spacingY = 200;
  return sorted.map((node, index) => {
    const row = Math.floor(index / perRow);
    const col = index % perRow;
    const positioned: BoardNode = {
      ...node,
      x: col * spacingX,
      y: row * spacingY,
    };
    return appendHistory(positioned, createHistoryEntry('move', 'Arranged to grid'));
  });
}

export function useBoard(options: UseBoardOptions = {}): UseBoardReturn {
  const { seed, storageKey = STORAGE_KEY, onChange } = options;
  const initialState = React.useMemo(() => {
    const stored = loadFromStorage(storageKey);
    if (stored) return stored;
    if (seed) return normalizeState(seed);
    return cloneState(BOARD_SEED);
  }, [seed, storageKey]);

  const [state, setState] = React.useState<BoardState>(initialState);
  const persistTimer = React.useRef<number>();

  const schedulePersist = React.useCallback(
    (nextState: BoardState) => {
      if (!canUseStorage()) return;
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
      persistTimer.current = window.setTimeout(() => {
        saveToStorage(storageKey, nextState);
      }, PERSIST_DELAY);
    },
    [storageKey]
  );

  React.useEffect(() => {
    if (!state) return;
    schedulePersist(state);
    onChange?.(state);
    return () => {
      if (persistTimer.current) {
        window.clearTimeout(persistTimer.current);
      }
    };
  }, [state, onChange, schedulePersist]);

  const updateState = React.useCallback((updater: (prev: BoardState) => BoardState) => {
    setState((prev) => {
      const next = updater(prev);
      return {
        ...next,
        lastUpdated: Date.now(),
      };
    });
  }, []);

  const actions = React.useMemo<BoardActions>(() => ({
    addNode(node) {
      updateState((prev) => {
        const exists = prev.nodes.some((n) => n.id === node.id);
        const baseNode = exists
          ? { ...node, id: `${node.id}-${Math.random().toString(36).slice(2, 5)}` }
          : node;
        return {
          ...prev,
          nodes: [
            ...prev.nodes,
            appendHistory(baseNode, createHistoryEntry('create', `Node ${baseNode.title} added`)),
          ],
        };
      });
    },
    updateNode(id, updates, opts) {
      updateState((prev) => {
        const nodes = prev.nodes.map((node) => {
          if (node.id !== id) return node;
          const nextNode = appendHistory(
            { ...node, ...updates },
            createHistoryEntry('edit', opts?.historySummary || 'Node updated')
          );
          return nextNode;
        });
        return {
          ...prev,
          nodes,
        };
      });
    },
    removeNode(id) {
      updateState((prev) => ({
        ...prev,
        nodes: prev.nodes.filter((node) => node.id !== id),
        edges: prev.edges.filter((edge) => edge.source !== id && edge.target !== id),
      }));
    },
    moveNode(id, position, opts) {
      updateState((prev) => {
        const nodes = prev.nodes.map((node) => {
          if (node.id !== id) return node;
          return appendHistory(
            { ...node, x: position.x, y: position.y },
            createHistoryEntry('move', opts?.historySummary || 'Node moved')
          );
        });
        return {
          ...prev,
          nodes,
        };
      });
    },
    moveNodes(ids, delta, opts) {
      if (!ids.length) return;
      updateState((prev) => {
        const idSet = new Set(ids);
        const nodes = prev.nodes.map((node) => {
          if (!idSet.has(node.id)) return node;
          return appendHistory(
            { ...node, x: node.x + delta.x, y: node.y + delta.y },
            createHistoryEntry('move', opts?.historySummary || 'Group moved')
          );
        });
        return {
          ...prev,
          nodes,
        };
      });
    },
    addEdge(edge) {
      updateState((prev) => {
        const exists = prev.edges.some((e) => e.id === edge.id);
        const id = exists ? `${edge.id}-${Math.random().toString(36).slice(2, 6)}` : edge.id;
        const enriched = { ...edge, id };
        return {
          ...prev,
          edges: [...prev.edges, enriched],
        };
      });
    },
    updateEdge(id, updates) {
      updateState((prev) => ({
        ...prev,
        edges: prev.edges.map((edge) => (edge.id === id ? { ...edge, ...updates } : edge)),
      }));
    },
    removeEdge(id) {
      updateState((prev) => ({
        ...prev,
        edges: prev.edges.filter((edge) => edge.id !== id),
      }));
    },
    setViewport(viewport) {
      updateState((prev) => ({
        ...prev,
        viewport,
      }));
    },
    save() {
      saveToStorage(storageKey, { ...state, lastUpdated: Date.now() });
    },
    load(payload) {
      const fromPayload = payload ? normalizeState(payload) : loadFromStorage(storageKey) ?? cloneState(BOARD_SEED);
      setState(fromPayload);
    },
    exportJSON() {
      return JSON.stringify(state, null, 2);
    },
    importJSON(payload) {
      try {
        const parsed = JSON.parse(payload) as BoardState;
        const normalized = normalizeState(parsed);
        setState(normalized);
        saveToStorage(storageKey, normalized);
        return { state: normalized };
      } catch (error) {
        return { state: null, error: error instanceof Error ? error : new Error('Invalid board JSON') };
      }
    },
    resetToSeed() {
      const clone = cloneState(seed ?? BOARD_SEED);
      setState(clone);
      saveToStorage(storageKey, clone);
    },
    arrange() {
      updateState((prev) => ({
        ...prev,
        nodes: simpleArrange(prev.nodes),
      }));
    },
  }), [seed, state, storageKey, updateState]);

  React.useEffect(() => () => {
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
  }, []);

  return { state, actions };
}

export type { BoardNode, BoardEdge, BoardState, BoardViewport, BoardHistoryEntry };
