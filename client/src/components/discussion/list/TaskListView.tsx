import React, { useMemo, useState, useCallback } from "react";
import { useTasks } from "../../../context/TasksContext";
import TaskSection from "./TaskSection";
import type { Task } from "../../../types";

const TaskListView: React.FC = () => {
  const { tasks, deleteTask } = useTasks();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = useCallback(async (task: Task) => {
    if (typeof window !== "undefined") {
      const confirmed = window.confirm("Are you sure you want to delete this task?");
      if (!confirmed) return;
    }

    setDeletingId(task.id);
    try {
      await deleteTask(task.id);
    } catch (error) {
      console.error("[tasks] failed to delete task", error);
    } finally {
      setDeletingId((prev) => (prev === task.id ? null : prev));
    }
  }, [deleteTask]);

  const groups = useMemo(
    () => ({
      TODO: tasks.filter((t) => t.status === "TODO"),
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
      COMPLETED: tasks.filter((t) => t.status === "COMPLETED"),
    }),
    [tasks]
  );

  return (
    <div className="space-y-6">
      <TaskSection title="To do" items={groups.TODO} color="gray" onDelete={handleDelete} deletingId={deletingId} />
      <TaskSection title="In Progress" items={groups.IN_PROGRESS} color="blue" onDelete={handleDelete} deletingId={deletingId} />
      <TaskSection title="Completed" items={groups.COMPLETED} color="green" onDelete={handleDelete} deletingId={deletingId} />
    </div>
  );
};

export default TaskListView;
