/* @vitest-environment jsdom */

import * as React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BoardCanvas from './BoardCanvas';
import { BOARD_SEED } from './BoardSeed';

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

describe('BoardCanvas', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });

    const storage = new MemoryStorage();
    vi.stubGlobal('localStorage', storage);
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      configurable: true,
    });

    Object.defineProperty(window, 'matchMedia', {
      value: (query: string) => ({
        matches: false,
        media: query,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }),
      configurable: true,
    });

    class RO {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', RO);

    const ctor: any = (globalThis as any).SVGPathElement || function SVGPathElement() {};
    if (!(globalThis as any).SVGPathElement) {
      (globalThis as any).SVGPathElement = ctor;
    }
    const proto = ctor.prototype as Record<string, any>;
    if (typeof proto.getTotalLength !== 'function') {
      Object.defineProperty(proto, 'getTotalLength', {
        value: () => 200,
        configurable: true,
        writable: true,
      });
    }
    if (typeof proto.getPointAtLength !== 'function') {
      Object.defineProperty(proto, 'getPointAtLength', {
        value: () => ({ x: 0, y: 0 }) as DOMPoint,
        configurable: true,
        writable: true,
      });
    }
    vi.spyOn(proto as any, 'getTotalLength').mockImplementation(() => 200);
    vi.spyOn(proto as any, 'getPointAtLength').mockImplementation((...args: unknown[]) => {
      const distance = typeof args[0] === 'number' ? args[0] : 0;
      const ratio = distance / 200;
      return { x: ratio * 200, y: 0 } as DOMPoint;
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders without triggering maximum update depth', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = render(<BoardCanvas seed={BOARD_SEED} />);

    vi.runOnlyPendingTimers();

    const depthErrors = errorSpy.mock.calls.filter(([msg]) =>
      typeof msg === 'string' && msg.includes('Maximum update depth exceeded')
    );
    expect(depthErrors.length).toBe(0);

    unmount();
    errorSpy.mockRestore();
  });
});
