import React, { useMemo, useState, useCallback } from "react";
import { useTasks } from "../../../context/TasksContext";
import KanbanColumn from "./KanbanColumn";
import type { Task, TaskStatus } from "../../../types";
import DndProvider from "../dnd/DndProvider";

const KanbanBoard: React.FC = () => {
  const { tasks, moveTask, deleteTask } = useTasks();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const groups = useMemo(
    () => ({
      TODO: tasks.filter((t) => t.status === "TODO"),
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
      COMPLETED: tasks.filter((t) => t.status === "COMPLETED"),
    }),
    [tasks]
  );

  // Placeholder: هنفعّل DnD لاحقًا، دلوقتي عندنا دوال جاهزة للنقل بالAPI
  const handleDrop = async (taskId: number, toStatus: TaskStatus, toIndex: number) => {
    await moveTask(taskId, { toStatus, toIndex });
  };

  const onOpen = (t: Task) => {
    // TODO: افتح مودال التفاصيل لاحقًا
    alert(`Open task #${t.id}: ${t.title}`);
  };

  const onMore = (t: Task) => {
    // TODO: قائمة إجراءات (Edit, Delete, Change status…)
    alert(`More actions for #${t.id}`);
  };

  const onDelete = useCallback(async (task: Task) => {
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

  return (
    <DndProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KanbanColumn
          title="To do"
          status="TODO"
          items={groups.TODO}
          onOpen={onOpen}
          onMore={onMore}
          onDelete={onDelete}
          deletingId={deletingId}
          onDropTask={(id, idx) => handleDrop(id, "TODO", idx)}
        />
        <KanbanColumn
          title="In Progress"
          status="IN_PROGRESS"
          items={groups.IN_PROGRESS}
          onOpen={onOpen}
          onMore={onMore}
          onDelete={onDelete}
          deletingId={deletingId}
          onDropTask={(id, idx) => handleDrop(id, "IN_PROGRESS", idx)}
        />
        <KanbanColumn
          title="Completed"
          status="COMPLETED"
          items={groups.COMPLETED}
          onOpen={onOpen}
          onMore={onMore}
          onDelete={onDelete}
          deletingId={deletingId}
          onDropTask={(id, idx) => handleDrop(id, "COMPLETED", idx)}
        />
      </div>
    </DndProvider>
  );
};

export default KanbanBoard;
