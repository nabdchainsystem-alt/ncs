import React, { createContext, useContext, useMemo, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  Over
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, TaskStatus } from "../../../types";
import { useTasks } from "../../../context/TasksContext";

// Columns we support (TailAdmin-like)
export const COLUMN_IDS: TaskStatus[] = ["TODO", "IN_PROGRESS", "COMPLETED"];

/**
 * Utilities to encode/decode draggable IDs so we can distinguish between items and columns.
 */
const itemId = (taskId: number) => `task:${taskId}`;
const columnId = (status: TaskStatus) => `col:${status}`;
const isItemId = (id: string) => id.startsWith("task:");
const isColumnId = (id: string) => id.startsWith("col:");
const parseItemId = (id: string) => Number(id.split(":")[1]);
const parseColumnId = (id: string) => id.split(":")[1] as TaskStatus;

// ---- Context for exposing DnD helpers to children ----
interface DndHelpers {
  SortableTask: React.FC<{ task: Task; className?: string; children: (bind: any) => React.ReactNode }>;
  Column: React.FC<{ status: TaskStatus; items: Task[]; className?: string; children: React.ReactNode }>;
}

const DndHelpersContext = createContext<DndHelpers | null>(null);
export const useDndHelpers = () => {
  const ctx = useContext(DndHelpersContext);
  if (!ctx) throw new Error("useDndHelpers must be used inside <DndProvider>");
  return ctx;
};

/**
 * DndProvider wires dnd-kit sensors + onDrag handlers that call our API (moveTask)
 * and exposes helper components: SortableTask + Column for easy wiring in List/Kanban.
 */
export const DndProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const { tasks, moveTask } = useTasks();
  const [activeId, setActiveId] = useState<string | null>(null);

  const itemsByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], COMPLETED: [] };
    for (const t of tasks) map[t.status as TaskStatus]?.push(t);
    // sort by `order` then id to stabilize
    for (const k of COLUMN_IDS) map[k].sort((a, b) => (a.order - b.order) || (a.id - b.id));
    return map;
  }, [tasks]);

  function findIndexInStatus(taskId: number, status: TaskStatus): number {
    return itemsByStatus[status].findIndex((t) => t.id === taskId);
  }

  function computeDestinationIndex(over: Over | null, destStatus: TaskStatus, draggedId: number): number {
    if (!over) return itemsByStatus[destStatus].length; // drop to end by default

    const overId = String(over.id);
    // If over a column, append to end
    if (isColumnId(overId)) {
      return itemsByStatus[destStatus].length;
    }

    // Over another item → position relative to that item's index
    if (isItemId(overId)) {
      const overTaskId = parseItemId(overId);
      const overIndex = findIndexInStatus(overTaskId, destStatus);
      if (overIndex === -1) return itemsByStatus[destStatus].length;

      // If dragging within the same column and crossing over items, we rely on server to normalize
      // Here we drop before the hovered item by default
      const draggedIndex = findIndexInStatus(draggedId, destStatus);
      const insertBefore = draggedIndex < overIndex ? overIndex : overIndex; // consistent behavior
      return Math.max(0, insertBefore);
    }

    return itemsByStatus[destStatus].length;
  }

  const handleDragStart = (ev: DragStartEvent) => {
    setActiveId(String(ev.active.id));
  };

  const handleDragEnd = async (ev: DragEndEvent) => {
    const { active, over } = ev;
    const activeKey = String(active.id);
    setActiveId(null);
    if (!over) return;

    // Determine source
    if (!isItemId(activeKey)) return; // we only drag tasks
    const taskId = parseItemId(activeKey);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const fromStatus = task.status;

    // Determine destination
    const overKey = String(over.id);
    let toStatus: TaskStatus = fromStatus;
    if (isColumnId(overKey)) {
      toStatus = parseColumnId(overKey);
    } else if (isItemId(overKey)) {
      // infer status from hovered item
      const overTaskId = parseItemId(overKey);
      const overTask = tasks.find((t) => t.id === overTaskId);
      toStatus = overTask ? overTask.status as TaskStatus : fromStatus;
    }

    // Compute index in destination
    const toIndex = computeDestinationIndex(over, toStatus, taskId);

    try {
      await moveTask(taskId, { toStatus, toIndex });
    } catch (e) {
      // Context handles refresh on error; nothing extra here
    }
  };

  // --- Helper components ---
  const SortableTask: DndHelpers["SortableTask"] = ({ task, className = "", children }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: itemId(task.id),
    });
    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : undefined,
      cursor: "grab",
    };
    return (
      <li ref={setNodeRef} style={style} className={className} {...attributes} {...listeners}>
        {children({ attributes, listeners })}
      </li>
    );
  };

  const Column: DndHelpers["Column"] = ({ status, items, className = "", children }) => {
    return (
      <SortableContext
        items={items.map((t) => itemId(t.id))}
        strategy={rectSortingStrategy}
      >
        <div id={columnId(status)} data-col={status} className={className}>
          {children}
        </div>
      </SortableContext>
    );
  };

  const helpers = useMemo<DndHelpers>(() => ({ SortableTask, Column }), []);

  return (
    <DndHelpersContext.Provider value={helpers}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}
      </DndContext>
    </DndHelpersContext.Provider>
  );
};

export default DndProvider;
