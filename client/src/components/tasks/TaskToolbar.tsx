

import * as React from 'react';
import Button from '../ui/Button';

export type ViewMode = 'list' | 'kanban';

export interface TaskToolbarProps {
  viewMode: ViewMode;
  onToggleView: (mode: ViewMode) => void;
  onAddNew: () => void;
  onOpenFilter: () => void;
  className?: string;
  rightSlot?: React.ReactNode; // optional slot if parent wants to inject extra controls
}

/**
 * Tasks Toolbar — TailAdmin-like bar with title, view switch (List | Kanban),
 * Filter & Sort button, and Add New Task primary action.
 */
export default function TaskToolbar({
  viewMode,
  onToggleView,
  onAddNew,
  onOpenFilter,
  className,
  rightSlot,
}: TaskToolbarProps) {
  return (
    <div
      className={
        'flex flex-wrap items-center justify-between gap-3 ' +
        (className ? className : '')
      }
    >
      {/* Left side: Title + Switch */}
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Tasks ( List & Kanban )
        </h3>
        <Segmented
          value={viewMode}
          onChange={(v) => onToggleView(v)}
          options={[
            { label: 'List', value: 'list' },
            { label: 'Kanban', value: 'kanban' },
          ]}
        />
      </div>

      {/* Right side: Filters + Add New */}
      <div className="ml-auto flex items-center gap-2">
        {rightSlot}
        <Button variant="outline" size="sm" onClick={onOpenFilter}>
          Filter &amp; Sort
        </Button>
        <Button size="sm" onClick={onAddNew}>
          Add New Task
        </Button>
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <div className="inline-flex rounded-xl border p-0.5 text-xs bg-white">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={
              'px-2 py-1 rounded-lg transition-colors ' +
              (active
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-600 hover:bg-gray-50')
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}