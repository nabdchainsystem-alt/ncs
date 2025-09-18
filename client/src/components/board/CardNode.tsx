import * as React from 'react';
import { MessageCircle, Link2, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import type { BoardNode } from '../../types/board';
import Button from '../ui/Button';

const DEPT_COLORS: Record<string, string> = {
  Production: '#F97316',
  Finance: '#6366F1',
  Warehouse: '#14B8A6',
  Logistics: '#0EA5E9',
  QA: '#EF4444',
  Operations: '#F59E0B',
};

type CardNodeProps = {
  node: BoardNode;
  selected: boolean;
  dimmed?: boolean;
  isDragging?: boolean;
  linkMode?: boolean;
  style?: React.CSSProperties;
  tabIndex?: number;
  onPointerDown: (event: React.PointerEvent<HTMLDivElement>, node: BoardNode) => void;
  onPointerMove: (event: React.PointerEvent<HTMLDivElement>, node: BoardNode) => void;
  onPointerUp: (event: React.PointerEvent<HTMLDivElement>, node: BoardNode) => void;
  onKeyMove: (id: string, delta: { x: number; y: number }) => void;
  onDelete: (id: string) => void;
  onEnter: (id: string) => void;
  onRequestLink: (id: string) => void;
  onComment?: (id: string) => void;
  onFocusChange?: (id: string, focused: boolean) => void;
  onSizeChange?: (id: string, size: { width: number; height: number }) => void;
};

const formatDate = (date?: string) => {
  if (!date) return 'No due date';
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return date;
  }
};

export function CardNode({
  node,
  selected,
  dimmed,
  isDragging,
  linkMode,
  style,
  tabIndex = 0,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyMove,
  onDelete,
  onEnter,
  onRequestLink,
  onComment,
  onFocusChange,
  onSizeChange,
}: CardNodeProps) {
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);

  React.useLayoutEffect(() => {
    if (!nodeRef.current || !onSizeChange) return;
    const rect = nodeRef.current.getBoundingClientRect();
    onSizeChange(node.id, { width: rect.width, height: rect.height });
  }, [node.id, onSizeChange, node.title, node.body, node.status]);

  const borderColor = node.color || (node.dept ? DEPT_COLORS[node.dept] : '#64748b');

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      onEnter(node.id);
      return;
    }
    if (key === 'Delete' || key === 'Backspace') {
      event.preventDefault();
      onDelete(node.id);
      return;
    }
    const step = event.shiftKey ? 10 : event.ctrlKey || event.metaKey ? 20 : 4;
    if (key === 'ArrowUp') {
      event.preventDefault();
      onKeyMove(node.id, { x: 0, y: -step });
    } else if (key === 'ArrowDown') {
      event.preventDefault();
      onKeyMove(node.id, { x: 0, y: step });
    } else if (key === 'ArrowLeft') {
      event.preventDefault();
      onKeyMove(node.id, { x: -step, y: 0 });
    } else if (key === 'ArrowRight') {
      event.preventDefault();
      onKeyMove(node.id, { x: step, y: 0 });
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(node.id, true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange?.(node.id, false);
  };

  return (
    <div
      ref={nodeRef}
      role="group"
      tabIndex={tabIndex}
      aria-label={`Board card ${node.title}`}
      aria-selected={selected}
      data-node-id={node.id}
      className={clsx(
        'absolute select-none outline-none ring-0',
        'board-node-card',
        selected && 'is-selected',
        dimmed && 'is-dimmed',
        isDragging && 'is-dragging'
      )}
      style={{
        transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
        borderLeft: `4px solid ${borderColor}`,
        ...style,
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPointerDown(event, node);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          onPointerMove(event, node);
        }
      }}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        onPointerUp(event, node);
      }}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <div className="flex items-start gap-3 p-4">
        <div
          className={clsx(
            'board-node-handle mt-1 rounded-md border border-gray-200 bg-white/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500 shadow-sm transition-colors',
            selected ? 'border-primary-500 text-primary-600' : ''
          )}
        >
          Move
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-gray-800 leading-tight">{node.title}</h3>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{node.dept ?? 'General'}</span>
          </div>
          {node.body ? (
            <p className="mt-2 text-xs leading-snug text-gray-600 line-clamp-3">{node.body}</p>
          ) : null}
          <div className="mt-3 flex flex-col gap-1 text-[11px] text-gray-500">
            <span className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-900/80 text-[11px] font-semibold uppercase text-white">
                {node.ownerAvatar ?? node.owner?.split(' ').map((part) => part[0]).join('').slice(0, 2) ?? '?'}
              </span>
              <span className="truncate font-medium text-gray-700">{node.owner ?? 'Unassigned'}</span>
            </span>
            <span className="flex items-center justify-between text-gray-500">
              <span>Due {formatDate(node.dueDate)}</span>
              <span
                className={clsx(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  node.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-600'
                    : node.status === 'Pending'
                    ? 'bg-amber-100 text-amber-600'
                    : node.status === 'Draft'
                    ? 'bg-gray-100 text-gray-500'
                    : 'bg-sky-100 text-sky-600'
                )}
              >
                {node.status ?? 'Unknown'}
              </span>
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-gray-200/80 bg-slate-50/70 px-4 py-2.5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="rounded-md px-2 py-1 text-[11px] font-medium text-gray-600 transition hover:bg-white hover:text-gray-900"
            onClick={() => onComment?.(node.id)}
          >
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Comment
            </span>
          </button>
          <button
            type="button"
            className={clsx(
              'rounded-md px-2 py-1 text-[11px] font-medium transition',
              linkMode ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-white hover:text-gray-900'
            )}
            onClick={() => onRequestLink(node.id)}
          >
            <span className="inline-flex items-center gap-1">
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              Link
            </span>
          </button>
        </div>
        <Button
          variant="ghost"
          size="xs"
          className="h-7 px-2 text-[11px] font-semibold text-primary-600 hover:bg-primary-50"
          onClick={() => onEnter(node.id)}
        >
          <span className="inline-flex items-center gap-1">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            Open
          </span>
        </Button>
      </div>
      {isFocused ? <span className="sr-only">Press arrow keys to move, Enter to open inspector</span> : null}
    </div>
  );
}

export default CardNode;
