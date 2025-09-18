import * as React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { BoardEdge, BoardNode } from '../../types/board';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export type LinkArrowProps = {
  edge: BoardEdge;
  source: BoardNode;
  target: BoardNode;
  sourceSize?: { width: number; height: number };
  targetSize?: { width: number; height: number };
  index?: number;
  selected?: boolean;
  zoom: number;
  showLabel: boolean;
  showArrowhead: boolean;
  perfMode?: boolean;
  freezeLabel?: boolean;
  onSelect: (edgeId: string) => void;
  onEdit: (edgeId: string) => void;
  onDelete: (edgeId: string) => void;
};

const DEFAULT_NODE_DIMENSIONS = { width: 240, height: 180 };

type Point = { x: number; y: number };

type ColorPair = { start: string; end: string };

const COLOR_PALETTE: ColorPair[] = [
  { start: '#6366F1', end: '#4338CA' },
  { start: '#0EA5E9', end: '#0369A1' },
  { start: '#14B8A6', end: '#0F766E' },
  { start: '#F97316', end: '#C2410C' },
  { start: '#EC4899', end: '#BE185D' },
  { start: '#22D3EE', end: '#0891B2' },
];

function getCenter(node: BoardNode, size?: { width: number; height: number }): Point {
  const { width, height } = size ?? DEFAULT_NODE_DIMENSIONS;
  return {
    x: node.x + width / 2,
    y: node.y + height / 2,
  };
}

function hashToIndex(id: string, fallback = 0) {
  if (!id) return fallback;
  let acc = 0;
  for (let i = 0; i < id.length; i += 1) {
    acc = (acc + id.charCodeAt(i) * (i + 1)) % 997;
  }
  return acc;
}

function adjustColor(hex: string, factor: number) {
  const cleaned = hex.replace('#', '');
  const num = parseInt(cleaned, 16);
  // eslint-disable-next-line no-bitwise
  const r = (num >> 16) & 0xff;
  // eslint-disable-next-line no-bitwise
  const g = (num >> 8) & 0xff;
  // eslint-disable-next-line no-bitwise
  const b = num & 0xff;
  const clamp = (value: number) => Math.min(255, Math.max(0, value));
  const adjusted = (channel: number) => clamp(Math.round(channel * factor));
  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');
  return `#${toHex(adjusted(r))}${toHex(adjusted(g))}${toHex(adjusted(b))}`;
}

function buildPath(start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const direction = Math.sign(dx) || 1;
  const baseOffset = Math.min(260, Math.abs(dx) * 0.45 + 120);
  const control1 = {
    x: start.x + direction * baseOffset,
    y: start.y + dy * 0.18,
  };
  const control2 = {
    x: end.x - direction * baseOffset,
    y: end.y - dy * 0.18,
  };
  const d = `M ${start.x} ${start.y} C ${control1.x} ${control1.y} ${control2.x} ${control2.y} ${end.x} ${end.y}`;
  return { d, distance };
}

export function LinkArrow({
  edge,
  source,
  target,
  sourceSize,
  targetSize,
  index,
  selected,
  zoom,
  showLabel,
  showArrowhead,
  perfMode,
  freezeLabel = false,
  onSelect,
  onEdit,
  onDelete,
}: LinkArrowProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isHovered, setIsHovered] = React.useState(false);
  const [labelPoint, setLabelPoint] = React.useState<Point | null>(null);
  const pathRef = React.useRef<SVGPathElement | null>(null);
  const lastLabelPointRef = React.useRef<Point | null>(null);
  const pendingLabelUpdateRef = React.useRef(false);

  const start = getCenter(source, sourceSize);
  const end = getCenter(target, targetSize);
  const { d } = React.useMemo(() => buildPath(start, end), [start.x, start.y, end.x, end.y]);

  const paletteIndex = React.useMemo(() => {
    const hashed = hashToIndex(edge.id ?? '', index ?? 0);
    return hashed % COLOR_PALETTE.length;
  }, [edge.id, index]);

  const baseColors = COLOR_PALETTE[paletteIndex] ?? COLOR_PALETTE[0];
  const glowFactor = selected ? 1.12 : isHovered ? 1.06 : 1;
  const startColor = React.useMemo(() => adjustColor(baseColors.start, glowFactor), [baseColors.start, glowFactor]);
  const endColor = React.useMemo(() => adjustColor(baseColors.end, glowFactor), [baseColors.end, glowFactor]);

  const gradientId = React.useMemo(() => `arrow-gradient-${edge.id}`.replace(/[^a-zA-Z0-9-_]/g, ''), [edge.id]);
  const markerId = React.useMemo(() => `arrow-marker-${edge.id}`.replace(/[^a-zA-Z0-9-_]/g, ''), [edge.id]);
  const filterId = React.useMemo(() => `arrow-filter-${edge.id}`.replace(/[^a-zA-Z0-9-_]/g, ''), [edge.id]);
  const glowFilterId = React.useMemo(() => `arrow-filter-glow-${edge.id}`.replace(/[^a-zA-Z0-9-_]/g, ''), [edge.id]);
  const labelId = React.useMemo(() => `arrow-label-${edge.id}`.replace(/[^a-zA-Z0-9-_]/g, ''), [edge.id]);

  const shouldFlow = isHovered && !selected && !prefersReducedMotion && !perfMode && zoom >= 0.35;
  const strokeWidth = selected ? 4 : isHovered ? 3.5 : 2.5;

  const recomputeLabelPoint = React.useCallback(() => {
    const pathEl = pathRef.current;
    if (!showLabel) {
      if (lastLabelPointRef.current !== null) {
        lastLabelPointRef.current = null;
        setLabelPoint(null);
      }
      return;
    }
    if (!pathEl) return;
    if (
      typeof (pathEl as any).getTotalLength !== 'function' ||
      typeof (pathEl as any).getPointAtLength !== 'function'
    ) {
      return;
    }
    const length = pathEl.getTotalLength();
    if (!Number.isFinite(length) || length === 0) return;
    const mid = length * 0.5;
    const center = pathEl.getPointAtLength(mid);
    const before = pathEl.getPointAtLength(Math.max(0, mid - 1));
    const after = pathEl.getPointAtLength(Math.min(length, mid + 1));
    const tangent = { x: after.x - before.x, y: after.y - before.y };
    const magnitude = Math.hypot(tangent.x, tangent.y) || 1;
    const normal = { x: -tangent.y / magnitude, y: tangent.x / magnitude };
    const offset = 18;
    const nextPoint = { x: center.x + normal.x * offset, y: center.y + normal.y * offset };
    const prev = lastLabelPointRef.current;
    if (prev && Math.abs(prev.x - nextPoint.x) < 0.4 && Math.abs(prev.y - nextPoint.y) < 0.4) {
      return;
    }
    lastLabelPointRef.current = nextPoint;
    setLabelPoint(nextPoint);
  }, [showLabel, d, end.x, end.y, start.x, start.y]);

  React.useEffect(() => {
    if (freezeLabel) {
      pendingLabelUpdateRef.current = true;
      return;
    }
    if (!showLabel) {
      lastLabelPointRef.current = null;
      setLabelPoint(null);
      pendingLabelUpdateRef.current = false;
      return;
    }

    let frame = 0;
    const run = () => {
      recomputeLabelPoint();
      pendingLabelUpdateRef.current = false;
    };
    frame = window.requestAnimationFrame(run);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [freezeLabel, recomputeLabelPoint, showLabel]);

  React.useEffect(() => {
    if (!freezeLabel && pendingLabelUpdateRef.current) {
      recomputeLabelPoint();
      pendingLabelUpdateRef.current = false;
    }
  }, [freezeLabel, recomputeLabelPoint]);

  const handleKeyDown = (event: React.KeyboardEvent<SVGGElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(edge.id);
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      onDelete(edge.id);
    }
  };

  const ariaLabel = `${edge.label ? `${edge.label} ` : ''}${source.title} → ${target.title}`;
  const describedBy = showLabel ? labelId : undefined;

  return (
    <g
      role="button"
      tabIndex={0}
      aria-pressed={selected || undefined}
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      className={clsx('board-arrow-group', selected && 'is-selected')}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect(edge.id);
      }}
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
          <stop offset="0%" stopColor={startColor} />
          <stop offset="100%" stopColor={endColor} />
        </linearGradient>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="1.2" floodOpacity="0.24" floodColor={endColor} />
        </filter>
        <filter id={glowFilterId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="1.2" floodOpacity="0.32" floodColor={startColor} />
          <feDropShadow dx="0" dy="0" stdDeviation="2.1" floodOpacity="0.45" floodColor={endColor} />
        </filter>
        <marker
          id={markerId}
          orient="auto"
          markerUnits="strokeWidth"
          markerWidth="11"
          markerHeight="11"
          refX="9"
          refY="5"
        >
          <path d="M0,0 L0,10 L9,5 Z" fill={endColor} opacity={selected ? 0.92 : 0.82} />
        </marker>
      </defs>

      <path
        ref={pathRef}
        className={clsx('board-arrow-path', {
          'is-hovered': isHovered,
          'is-selected': selected,
          'has-flow': shouldFlow,
        })}
        d={d}
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        markerEnd={showArrowhead ? `url(#${markerId})` : undefined}
        filter={`url(#${selected ? glowFilterId : filterId})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: showArrowhead || showLabel ? 0.96 : 0.55 }}
      />

      {!prefersReducedMotion && showArrowhead ? (
        <circle
          className="board-arrow-tip"
          cx={end.x}
          cy={end.y}
          r={selected ? 3.3 : 3}
          fill={endColor}
          opacity={selected ? 0.72 : 0.5}
        />
      ) : null}

      {showLabel && labelPoint ? (
        <foreignObject x={labelPoint.x} y={labelPoint.y} width={220} height={48} className="pointer-events-none">
          <div className="board-arrow-label-wrapper" style={{ transform: 'translate(-50%, -50%)' }}>
            <div
              id={labelId}
              className="board-arrow-label-pill"
              title={edge.label ?? 'Link'}
            >
              {edge.label ?? 'Link'}
            </div>
          </div>
        </foreignObject>
      ) : null}

      {selected ? (
        <foreignObject
          x={(labelPoint?.x ?? end.x) + 96}
          y={(labelPoint?.y ?? end.y) - 22}
          width={122}
          height={42}
          className="pointer-events-none"
        >
          <div className="board-mini-modal pointer-events-auto flex items-center gap-2 px-3 py-1.5 text-[11px] font-semibold text-gray-600">
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-2 py-1 transition hover:bg-gray-100 hover:text-gray-800"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(edge.id);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-red-500 transition hover:bg-red-50 hover:text-red-600"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(edge.id);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}

export default LinkArrow;
