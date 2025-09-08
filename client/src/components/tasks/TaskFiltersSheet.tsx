import * as React from 'react';
import type { TaskStatus } from './taskTypes';
import Button from '../ui/Button';

export type TaskSortField = 'createdAt' | 'updatedAt' | 'dueDate' | 'title' | 'status';
export type TaskSortDir = 'asc' | 'desc';

export interface TaskFiltersValue {
  q?: string;
  statuses?: TaskStatus[];
  assignee?: string;
  tag?: string;
  dueFrom?: string; // yyyy-mm-dd
  dueTo?: string;   // yyyy-mm-dd
  sortField?: TaskSortField;
  sortDir?: TaskSortDir;
}

interface TaskFiltersSheetProps {
  onClose: () => void;
  onApply: (filters: TaskFiltersValue) => void;
  onClear?: () => void;
  initial?: TaskFiltersValue;
}

const ALL_STATUSES: TaskStatus[] = ['To do', 'In Progress', 'Completed'];

export default function TaskFiltersSheet({
  onClose,
  onApply,
  onClear,
  initial,
}: TaskFiltersSheetProps) {
  // local controlled state
  const [q, setQ] = React.useState(initial?.q ?? '');
  const [statuses, setStatuses] = React.useState<TaskStatus[]>(initial?.statuses ?? []);
  const [assignee, setAssignee] = React.useState(initial?.assignee ?? '');
  const [tag, setTag] = React.useState(initial?.tag ?? '');
  const [dueFrom, setDueFrom] = React.useState(initial?.dueFrom ?? '');
  const [dueTo, setDueTo] = React.useState(initial?.dueTo ?? '');
  const [sortField, setSortField] = React.useState<TaskSortField>(initial?.sortField ?? 'updatedAt');
  const [sortDir, setSortDir] = React.useState<TaskSortDir>(initial?.sortDir ?? 'desc');

  function toggleStatus(s: TaskStatus) {
    setStatuses(prev => (prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]));
  }

  function handleApply() {
    onApply({
      q: q.trim() || undefined,
      statuses: statuses.length ? statuses : undefined,
      assignee: assignee.trim() || undefined,
      tag: tag.trim() || undefined,
      dueFrom: dueFrom || undefined,
      dueTo: dueTo || undefined,
      sortField,
      sortDir,
    });
    onClose();
  }

  function handleClear() {
    setQ('');
    setStatuses([]);
    setAssignee('');
    setTag('');
    setDueFrom('');
    setDueTo('');
    setSortField('updatedAt');
    setSortDir('desc');
    onClear?.();
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/10" role="dialog" aria-modal="true">
      <div className="h-full w-full max-w-sm bg-white border-l shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="text-sm font-semibold">Filters &amp; Sort</div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 space-y-4 text-sm">
          {/* Search */}
          <div>
            <label className="text-xs text-gray-600">Search</label>
            <input
              className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus"
              placeholder="Search title, tags, notes…"
              value={q}
              onChange={(e) => setQ(e.currentTarget.value)}
            />
          </div>

          {/* Statuses */}
          <div>
            <label className="text-xs text-gray-600">Status</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ALL_STATUSES.map((s) => {
                const active = statuses.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStatus(s)}
                    className={
                      'rounded-xl border px-3 py-2 text-xs text-left transition-colors ' +
                      (active ? 'bg-primary-50 text-primary-700 border-primary-200' : 'hover:bg-gray-50')
                    }
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Assignee & Tag */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Assignee</label>
              <input
                className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus"
                placeholder="e.g. Nora"
                value={assignee}
                onChange={(e) => setAssignee(e.currentTarget.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Tag</label>
              <input
                className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus"
                placeholder="e.g. Marketing"
                value={tag}
                onChange={(e) => setTag(e.currentTarget.value)}
              />
            </div>
          </div>

          {/* Due range */}
          <div>
            <label className="text-xs text-gray-600">Due date range</label>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <input
                type="date"
                className="h-10 w-full rounded-xl border px-3 text-sm input-focus"
                value={dueFrom}
                onChange={(e) => setDueFrom(e.currentTarget.value)}
              />
              <input
                type="date"
                className="h-10 w-full rounded-xl border px-3 text-sm input-focus"
                value={dueTo}
                onChange={(e) => setDueTo(e.currentTarget.value)}
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-xs text-gray-600">Sort</label>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <select
                className="h-10 w-full rounded-xl border px-3 text-sm input-focus"
                value={sortField}
                onChange={(e) => setSortField(e.currentTarget.value as TaskSortField)}
              >
                <option value="updatedAt">Updated</option>
                <option value="createdAt">Created</option>
                <option value="dueDate">Due date</option>
                <option value="title">Title</option>
                <option value="status">Status</option>
              </select>
              <select
                className="h-10 w-full rounded-xl border px-3 text-sm input-focus"
                value={sortDir}
                onChange={(e) => setSortDir(e.currentTarget.value as TaskSortDir)}
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t">
          <Button variant="outline" size="md" onClick={handleClear}>
            Clear
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button size="md" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}