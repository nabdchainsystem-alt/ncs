import React from "react";
import type { Task } from "../../../types";

export interface TaskItemProps {
  task: Task;
  onOpen?: (task: Task) => void;
  onMore?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  deleting?: boolean;
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

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "danger" }> = ({
  variant = "outline",
  className = "",
  ...props
}) => {
  const base =
    "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300",
    danger: "border border-red-200 text-red-600 hover:bg-red-50 focus:ring-red-300",
  } as const;
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />;
};

const Meta: React.FC<{ task: Task }> = ({ task }) => {
  return (
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
  );
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onOpen, onMore, onDelete, deleting }) => {
  return (
    <li className="flex items-center justify-between px-4 py-3">
      <div className="flex items-center gap-3">
        <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
        <div>
          <div className="text-sm font-medium text-gray-900">{task.title}</div>
          {task.description ? (
            <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{task.description}</div>
          ) : null}
          <Meta task={task} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onDelete ? (
          <Button variant="danger" onClick={() => onDelete(task)} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        ) : null}
        <Button onClick={() => onOpen?.(task)}>Open</Button>
        <Button variant="outline" onClick={() => onMore?.(task)}>
          •••
        </Button>
      </div>
    </li>
  );
};

export default TaskItem;
