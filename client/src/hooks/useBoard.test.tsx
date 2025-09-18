import * as React from 'react';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useBoard } from './useBoard';
import type { BoardEdge, BoardNode, BoardState } from '../types/board';
import { BOARD_SEED } from '../components/board/BoardSeed';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  get length(): number {
    return this.store.size;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

type Harness = {
  readonly state: BoardState;
  readonly actions: ReturnType<typeof useBoard>['actions'];
  cleanup: () => void;
};

function renderUseBoard(seed?: BoardState): Harness {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let hook: ReturnType<typeof useBoard> | null = null;

  function TestHarness() {
    hook = useBoard({ seed });
    return null;
  }

  act(() => {
    root.render(<TestHarness />);
  });

  if (!hook) throw new Error('useBoard did not initialise');

  return {
    get state() {
      if (!hook) throw new Error('Hook not ready');
      return hook.state;
    },
    get actions() {
      if (!hook) throw new Error('Hook not ready');
      return hook.actions;
    },
    cleanup() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  } as Harness;
}

describe('useBoard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('adds and removes nodes', () => {
    const harness = renderUseBoard();
    const node: BoardNode = {
      id: 'test-node',
      title: 'QA Review',
      x: 120,
      y: 200,
    };

    act(() => {
      harness.actions.addNode(node);
    });
    expect(harness.state.nodes.some((n) => n.id === node.id)).toBe(true);

    act(() => {
      harness.actions.removeNode(node.id);
    });
    expect(harness.state.nodes.some((n) => n.id === node.id)).toBe(false);

    harness.cleanup();
  });

  it('adds and removes edges', () => {
    const harness = renderUseBoard(BOARD_SEED);
    const edge: BoardEdge = {
      id: 'edge-test',
      source: BOARD_SEED.nodes[0].id,
      target: BOARD_SEED.nodes[1].id,
      label: 'Test link',
    };

    act(() => harness.actions.addEdge(edge));
    expect(harness.state.edges.some((e) => e.id === edge.id)).toBe(true);

    act(() => harness.actions.removeEdge(edge.id));
    expect(harness.state.edges.some((e) => e.id === edge.id)).toBe(false);

    harness.cleanup();
  });

  it('persists to localStorage after changes', () => {
    const harness = renderUseBoard();
    const setSpy = vi.spyOn(window.localStorage, 'setItem');

    act(() => harness.actions.addNode({ id: 'persist-node', title: 'Persist', x: 10, y: 20 }));
    vi.advanceTimersByTime(450);

    expect(setSpy).toHaveBeenCalledWith('ncs_board_v1', expect.any(String));

    harness.cleanup();
  });
});
