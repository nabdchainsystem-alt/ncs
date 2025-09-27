import React from "react";
import type { Task } from "../../../types";
import TaskItem from "./TaskItem";

export interface TaskSectionProps {
  title: string; // "To do" | "In Progress" | "Completed"
  items: Task[];
  color?: "gray" | "blue" | "green";
  onOpen?: (task: Task) => void;
  onMore?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  deletingId?: number | null;
}

const badgeColor: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
};

const TaskSection: React.FC<TaskSectionProps> = ({ title, items, color = "gray", onOpen, onMore, onDelete, deletingId }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeColor[color]}`}>
            {items.length}
          </span>
        </div>
      </div>

      {/* Items */}
      <ul className="divide-y divide-gray-200">
        {items.map((t) => (
          <TaskItem
            key={t.id}
            task={t}
            onOpen={onOpen}
            onMore={onMore}
            onDelete={onDelete}
            deleting={deletingId === t.id}
          />
        ))}
        {items.length === 0 && (
          <li className="px-4 py-8 text-sm text-gray-500 text-center">No tasks</li>
        )}
      </ul>
    </div>
  );
};

export default TaskSection;
