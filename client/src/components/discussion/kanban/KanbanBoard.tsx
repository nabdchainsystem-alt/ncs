import React, { useMemo } from "react";
import { useTasks } from "../../../context/TasksContext";
import KanbanColumn from "./KanbanColumn";
import type { Task, TaskStatus } from "../../../types";
import DndProvider from "../dnd/DndProvider";

const KanbanBoard: React.FC = () => {
  const { tasks, moveTask } = useTasks();

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

  return (
    <DndProvider>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KanbanColumn
          title="To do"
          status="TODO"
          items={groups.TODO}
          onOpen={onOpen}
          onMore={onMore}
          onDropTask={(id, idx) => handleDrop(id, "TODO", idx)}
        />
        <KanbanColumn
          title="In Progress"
          status="IN_PROGRESS"
          items={groups.IN_PROGRESS}
          onOpen={onOpen}
          onMore={onMore}
          onDropTask={(id, idx) => handleDrop(id, "IN_PROGRESS", idx)}
        />
        <KanbanColumn
          title="Completed"
          status="COMPLETED"
          items={groups.COMPLETED}
          onOpen={onOpen}
          onMore={onMore}
          onDropTask={(id, idx) => handleDrop(id, "COMPLETED", idx)}
        />
      </div>
    </DndProvider>
  );
};

export default KanbanBoard;