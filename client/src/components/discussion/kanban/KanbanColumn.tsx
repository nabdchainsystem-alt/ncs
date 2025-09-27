import React from "react";
import type { Task, TaskStatus } from "../../../types";

export interface KanbanColumnProps {
  title: string;                // "To do" | "In Progress" | "Completed"
  status: TaskStatus;           // "TODO" | "IN_PROGRESS" | "COMPLETED"
  items: Task[];
  onOpen?: (task: Task) => void;
  onMore?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  deletingId?: number | null;
  // Placeholder hooks for DnD (نفعّلها لاحقًا)
  onDropTask?: (taskId: number, toIndex: number) => void;
}

const Badge: React.FC<{ children: React.ReactNode; tone?: "default" | "blue" | "amber" }> = ({
  children,
  tone = "default",
}) => {
  const styles =
    tone === "blue"
      ? "bg-blue-100 text-blue-700"
      : tone === "amber"
      ? "bg-amber-100 text-amber-700"
      : "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {children}
    </span>
  );
};

const Card: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">{children}</div>
);

const KanbanItem: React.FC<{
  task: Task;
  onOpen?: (t: Task) => void;
  onMore?: (t: Task) => void;
  onDelete?: (t: Task) => void;
  deleting?: boolean;
}> = ({ task, onOpen, onMore, onDelete, deleting }) => {
  return (
    <li className="cursor-default">
      <Card>
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-sm font-medium text-gray-900 truncate">{task.title}</div>
            {task.description ? (
              <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</div>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {task.label ? <Badge>{task.label}</Badge> : null}
              {task.priority ? <Badge tone="amber">{task.priority}</Badge> : null}
              {task.assignee ? <Badge tone="blue">{task.assignee}</Badge> : null}
              {task.dueDate ? (
                <span className="text-xs text-gray-500">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>
              ) : null}
              {typeof task.commentsCount === "number" && (
                <span className="text-xs text-gray-500">💬 {task.commentsCount}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
            onClick={() => onMore?.(task)}
          >
            •••
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {onDelete ? (
            <button
              type="button"
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => onDelete(task)}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          ) : null}
          <button
            type="button"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            onClick={() => onOpen?.(task)}
          >
            Open
          </button>
        </div>
      </Card>
    </li>
  );
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  items,
  onOpen,
  onMore,
  onDelete,
  deletingId,
  onDropTask,
}) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <span className="inline-flex items-center rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {items.length}
          </span>
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-3 min-h-[40px]">
        {items.map((t) => (
          <KanbanItem
            key={t.id}
            task={t}
            onOpen={onOpen}
            onMore={onMore}
            onDelete={onDelete}
            deleting={deletingId === t.id}
          />
        ))}
        {items.length === 0 && (
          <li className="text-xs text-gray-500 text-center py-6">No tasks</li>
        )}
      </ul>
    </div>
  );
};

export default KanbanColumn;
