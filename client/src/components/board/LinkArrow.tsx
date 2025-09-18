import * as React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import type { BoardEdge, BoardNode } from '../../types/board';

export type LinkArrowProps = {
  edge: BoardEdge;
  source: BoardNode;
  target: BoardNode;
  sourceSize?: { width: number; height: number };
  targetSize?: { width: number; height: number };
  selected?: boolean;
  onSelect: (edgeId: string) => void;
  onEdit: (edgeId: string) => void;
  onDelete: (edgeId: string) => void;
};

const DEFAULT_NODE_DIMENSIONS = { width: 240, height: 180 };

function getCenter(node: BoardNode, size?: { width: number; height: number }) {
  const { width, height } = size ?? DEFAULT_NODE_DIMENSIONS;
  return {
    x: node.x + width / 2,
    y: node.y + height / 2,
  };
}

function buildPath(
  start: { x: number; y: number },
  end: { x: number; y: number }
): { d: string; midPoint: { x: number; y: number } } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const curve = Math.min(320, Math.sqrt(dx * dx + dy * dy));
  const controlOffset = curve * 0.45;
  const control1 = { x: start.x + controlOffset, y: start.y + dy * 0.1 };
  const control2 = { x: end.x - controlOffset, y: end.y - dy * 0.1 };
  const d = `M ${start.x} ${start.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${end.x} ${end.y}`;
  const midPoint = {
    x: (start.x + end.x) / 2 + (dy * 0.08),
    y: (start.y + end.y) / 2 - (dx * 0.08),
  };
  return { d, midPoint };
}

export function LinkArrow({
  edge,
  source,
  target,
  sourceSize,
  targetSize,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: LinkArrowProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const start = getCenter(source, sourceSize);
  const end = getCenter(target, targetSize);
  const { d, midPoint } = buildPath(start, end);

  const gradientId = React.useMemo(() => `arrow-gradient-${edge.id}`.replace(/[^a-zA-Z0-9-_]/g, ''), [edge.id]);
  const markerId = React.useMemo(() => `arrow-marker-${edge.id}`.replace(/[^a-zA-Z0-9-_]/g, ''), [edge.id]);

  return (
    <g className="pointer-events-none">
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1={start.x} y1={start.y} x2={end.x} y2={end.y}>
          <stop offset="0%" stopColor="rgba(99,102,241,0.85)" />
          <stop offset="100%" stopColor="rgba(14,165,233,0.95)" />
        </linearGradient>
        <marker
          id={markerId}
          orient="auto"
          markerWidth="14"
          markerHeight="14"
          refX="12"
          refY="6"
        >
          <path d="M0,0 L0,12 L12,6 z" fill="url(#${gradientId})" />
        </marker>
      </defs>
      <path
        d={d}
        stroke={`url(#${gradientId})`}
        className={clsx('board-arrow-path pointer-events-auto', selected && 'is-active', isHovered && 'is-hovered')}
        markerEnd={`url(#${markerId})`}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect(edge.id);
        }}
      />
      <foreignObject x={midPoint.x - 60} y={midPoint.y - 16} width="120" height="32" className="pointer-events-none">
        <div className="flex h-8 w-full items-center justify-center">
          <div className="board-arrow-label pointer-events-auto">
            {edge.label ?? 'Link'}
          </div>
        </div>
      </foreignObject>
      {selected ? (
        <foreignObject x={midPoint.x + 70} y={midPoint.y - 18} width="90" height="36" className="pointer-events-none">
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
