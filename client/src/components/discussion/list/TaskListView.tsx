import React, { useMemo } from "react";
import { useTasks } from "../../../context/TasksContext";
import TaskSection from "./TaskSection";

const TaskListView: React.FC = () => {
  const { tasks } = useTasks();

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
      <TaskSection title="To do" items={groups.TODO} color="gray" />
      <TaskSection title="In Progress" items={groups.IN_PROGRESS} color="blue" />
      <TaskSection title="Completed" items={groups.COMPLETED} color="green" />
    </div>
  );
};

export default TaskListView;