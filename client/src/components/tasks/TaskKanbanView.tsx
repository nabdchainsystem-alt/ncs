// client/src/components/tasks/TaskKanbanView.tsx
import * as React from 'react';
import { useTaskStore } from './TaskStore';
import type { Task, TaskStatus } from './taskTypes';
import Button from '../ui/Button';

type Props = {
  /** اختياري: لو مرّرت tasks هنا، هيتجاهل TaskStore */
  tasks?: Task[];
  /** فلتر اختياري للوسم */
  tag?: string;
  /** فلتر اختياري للمسؤول */
  assignee?: string;
};

export default function TaskKanbanView({ tasks: tasksProp, tag, assignee }: Props) {
  const store = useSafeStore();
  const tasks = React.useMemo(() => {
    const src = tasksProp ?? store?.tasks ?? [];
    let res = [...src];

    if (tag && tag.trim()) {
      const t = tag.trim().toLowerCase();
      res = res.filter(x => (x.tags || []).some(g => g.toLowerCase() === t));
    }
    if (assignee && assignee.trim()) {
      const a = assignee.trim().toLowerCase();
      res = res.filter(x => (x.assignee || '').toLowerCase() === a);
    }

    return res;
  }, [tasksProp, store, tag, assignee]);

  const columns: { key: TaskStatus; title: string }[] = [
    { key: 'To do',       title: 'To Do' },
    { key: 'In Progress', title: 'In Progress' },
    { key: 'Completed',   title: 'Completed' },
  ];

  const byStatus = React.useMemo(() => groupByStatus(tasks), [tasks]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {columns.map(col => (
        <div key={col.key} className="rounded-2xl border bg-gray-50/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">
              {col.title}{' '}
              <span className="text-xs text-gray-500">({byStatus[col.key].length})</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              title="Add task to this column (demo)"
              onClick={() => {
                console.log('Add to', col.key);
              }}
            >
              + Add
            </Button>
          </div>

          <div className="space-y-2">
            {byStatus[col.key].length === 0 ? (
              <div className="rounded-xl border bg-white p-3 text-sm text-gray-500">No tasks</div>
            ) : (
              byStatus[col.key].map(t => <KanbanCard key={t.id} task={t} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------ Card ------------- */

function KanbanCard({ task }: { task: Task }) {
  return (
    <div className="rounded-xl border bg-white p-3 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-gray-800">{task.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <StatusPill status={task.status} />
            {task.tags?.map(tg => (
              <span key={tg} className="rounded-full border bg-gray-50 px-2 py-0.5">
                {tg}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {typeof task.commentsCount === 'number' && (
            <span className="inline-flex items-center gap-1" title="Comments">
              <CommentIcon className="h-3.5 w-3.5" />
              {task.commentsCount}
            </span>
          )}
          {task.dueDate && (
            <span className="inline-flex items-center gap-1" title="Due date">
              <CalendarIcon className="h-3.5 w-3.5" />
              {fmtDate(task.dueDate)}
            </span>
          )}
          {task.assignee && (
            <span className="inline-flex items-center gap-2" title="Assignee">
              <Avatar name={task.assignee} />
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button variant="outline" size="sm">Open</Button>
        <Button variant="outline" size="sm">Edit</Button>
      </div>
    </div>
  );
}

/* ----------- Helpers / UI ----------- */

function groupByStatus(items: Task[]) {
  const map: Record<TaskStatus, Task[]> = { 'To do': [], 'In Progress': [], 'Completed': [] } as any;
  for (const t of items) map[t.status]?.push(t);
  return map;
}

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
  return 'bg-blue-50 text-blue-700 border-blue-200'; // To do
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

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** يحاول استخدام TaskStore لو متاح */
function useSafeStore() {
  try {
    return useTaskStore();
  } catch {
    return null;
  }
}