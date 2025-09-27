import * as React from 'react';
import { useTaskStore } from './TaskStore';
import type { TaskStatus } from './taskTypes';
import Button from '../ui/Button';

type ListFilters = {
  q?: string;                // search text
  status?: TaskStatus | 'All';
  tag?: string;
  assignee?: string;
};

export default function TaskListView({ q, status = 'All', tag, assignee }: ListFilters) {
  const { tasks, removeTask } = useTaskStore();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = React.useCallback(
    async (taskId: string) => {
      if (typeof window !== 'undefined') {
        const confirmed = window.confirm('Are you sure you want to delete this task?');
        if (!confirmed) return;
      }

      setDeletingId(taskId);
      try {
        await removeTask(taskId);
      } catch (error) {
        console.error('[tasks] failed to delete task', error);
      } finally {
        setDeletingId((prev) => (prev === taskId ? null : prev));
      }
    },
    [removeTask],
  );

  const items = React.useMemo(() => {
    let res = [...tasks];

    if (q && q.trim()) {
      const needle = q.trim().toLowerCase();
      res = res.filter(t =>
        t.title.toLowerCase().includes(needle) ||
        (t.description || '').toLowerCase().includes(needle) ||
        (t.tags || []).some(x => x.toLowerCase().includes(needle))
      );
    }

    if (status && status !== 'All') {
      res = res.filter(t => t.status === status);
    }

    if (tag && tag.trim()) {
      const _tag = tag.trim().toLowerCase();
      res = res.filter(t => (t.tags || []).some(x => x.toLowerCase() === _tag));
    }

    if (assignee && assignee.trim()) {
      const _a = assignee.trim().toLowerCase();
      res = res.filter(t => (t.assignee || '').toLowerCase() === _a);
    }

    // ترتيب بسيط: In Progress -> To do -> Blocked -> Completed
    const rank: Record<TaskStatus, number> = { 'In Progress': 0, 'To do': 1, 'Blocked': 2, 'Completed': 3 };
    res.sort((a, b) => (rank[a.status] - rank[b.status]) || a.title.localeCompare(b.title));

    return res;
  }, [tasks, q, status, tag, assignee]);

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <div className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-600">
          No tasks match your filters.
        </div>
      ) : (
        items.map((t, i) => (
          <div
            key={t.id}
            className={
              'rounded-xl border bg-white px-3 py-2 flex items-center justify-between hover:bg-gray-50 ' +
              (i % 2 ? '' : 'bg-gray-50/40')
            }
          >
            {/* Left: checkbox + title + tags */}
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="h-4 w-4 rounded border text-[10px] text-gray-500 inline-flex items-center justify-center hover:bg-gray-50"
                title="Mark as done (demo)"
              >
                ✓
              </button>
              <div className="min-w-0">
                <div className="truncate text-sm text-gray-800">{t.title}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <StatusPill status={t.status} />
                  {t.tags?.map((tg) => (
                    <span key={tg} className="rounded-full border bg-gray-50 px-2 py-0.5">
                      {tg}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: meta (due, assignee, comments) */}
            <div className="flex flex-none items-center gap-3 text-xs text-gray-600">
              {t.dueDate ? (
                <span className="inline-flex items-center gap-1" title="Due date">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {fmtDate(t.dueDate)}
                </span>
              ) : null}

              {t.assignee ? (
                <span className="inline-flex items-center gap-2" title="Assignee">
                  <Avatar name={t.assignee} />
                  <span className="hidden sm:inline">{t.assignee}</span>
                </span>
              ) : null}

              {typeof t.commentsCount === 'number' ? (
                <span className="inline-flex items-center gap-1" title="Comments">
                  <CommentIcon className="h-3.5 w-3.5" />
                  {t.commentsCount}
                </span>
              ) : null}

              <Button
                variant="danger"
                size="sm"
                title="Delete"
                onClick={() => handleDelete(t.id)}
                disabled={deletingId === t.id}
              >
                {deletingId === t.id ? 'Deleting…' : 'Delete'}
              </Button>
              <Button variant="outline" size="sm" title="Open">
                Open
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------- UI bits ---------- */

function StatusPill({ status }: { status: TaskStatus }) {
  const cls = statusClass(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function statusClass(s: TaskStatus) {
  if (s === 'In Progress') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (s === 'Completed')  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s === 'Blocked')    return 'bg-rose-50 text-rose-700 border-rose-200';
  // 'To do'
  return 'bg-blue-50 text-blue-700 border-blue-200';
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border bg-white text-[10px] font-medium text-gray-700">
      {initials}
    </span>
  );
}

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="4" width="18" height="17" rx="2" stroke="currentColor" />
      <path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" />
    </svg>
  );
}

function CommentIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M21 12a7 7 0 0 1-7 7H7l-4 3V12a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7Z"
        stroke="currentColor"
      />
    </svg>
  );
}

/* ---------- helpers ---------- */

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
