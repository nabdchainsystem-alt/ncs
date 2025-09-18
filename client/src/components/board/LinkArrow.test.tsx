/* @vitest-environment jsdom */

import * as React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LinkArrow from './LinkArrow';
import type { BoardEdge, BoardNode } from '../../types/board';

const SOURCE: BoardNode = {
  id: 'source',
  title: 'Source',
  x: 0,
  y: 0,
};

const TARGET: BoardNode = {
  id: 'target',
  title: 'Target',
  x: 200,
  y: 40,
};

const EDGE: BoardEdge = {
  id: 'edge-1',
  source: SOURCE.id,
  target: TARGET.id,
};

let totalLengthSpy: ReturnType<typeof vi.spyOn> | null = null;
let pointSpy: ReturnType<typeof vi.spyOn> | null = null;

describe('LinkArrow stability', () => {
  let timersMocked = false;
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    timersMocked = true;
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
    totalLengthSpy = vi
      .spyOn(proto as any, 'getTotalLength')
      .mockImplementation(() => 200);
    pointSpy = vi
      .spyOn(proto as any, 'getPointAtLength')
      .mockImplementation((...args: unknown[]) => {
        const distance = typeof args[0] === 'number' ? args[0] : 0;
        const ratio = distance / 200;
        const x = SOURCE.x + (TARGET.x - SOURCE.x) * ratio;
        const y = SOURCE.y + (TARGET.y - SOURCE.y) * ratio;
        return { x, y } as DOMPoint;
      });
  });

  afterEach(() => {
    totalLengthSpy?.mockRestore();
    pointSpy?.mockRestore();
    totalLengthSpy = null;
    pointSpy = null;
    if (timersMocked) {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
      timersMocked = false;
    }
    vi.restoreAllMocks();
  });

  it('does not trigger nested updates when toggling freezeLabel', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { rerender, unmount } = render(
      <svg>
        <LinkArrow
          edge={EDGE}
          source={SOURCE}
          target={TARGET}
          sourceSize={{ width: 240, height: 180 }}
          targetSize={{ width: 240, height: 180 }}
          index={0}
          selected={false}
          zoom={1}
          showLabel
          showArrowhead
          perfMode={false}
          freezeLabel
          onSelect={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </svg>
    );

    rerender(
      <svg>
        <LinkArrow
          edge={EDGE}
          source={{ ...SOURCE, x: 20 }}
          target={{ ...TARGET, x: 220 }}
          sourceSize={{ width: 240, height: 180 }}
          targetSize={{ width: 240, height: 180 }}
          index={0}
          selected={false}
          zoom={1}
          showLabel
          showArrowhead
          perfMode={false}
          freezeLabel={false}
          onSelect={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </svg>
    );

    vi.runOnlyPendingTimers();

    const depthErrors = errorSpy.mock.calls.filter(([msg]) =>
      typeof msg === 'string' && msg.includes('Maximum update depth exceeded')
    );
    expect(depthErrors.length).toBe(0);

    unmount();
    errorSpy.mockRestore();
  });
});
