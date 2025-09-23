import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Task, TaskStatus } from "../types";
import { listTasks, createTask as apiCreateTask, updateTask as apiUpdateTask, deleteTask as apiDeleteTask, moveTask as apiMoveTask, type TaskListParams } from "../lib/api";
import { useApiHealth } from "./ApiHealthContext";

// Tabs labels mapping to statuses
export type TasksTab = "all" | TaskStatus; // "all" | "TODO" | "IN_PROGRESS" | "COMPLETED"

export type TasksFilter = {
  search?: string;
  assignee?: string;
  label?: string;
};

export type TasksSort = {
  sort?: TaskListParams["sort"]; // createdAt | dueDate | priority | order
  order?: TaskListParams["order"]; // asc | desc
};

export interface TasksContextValue {
  loading: boolean;
  tab: TasksTab;
  setTab: (t: TasksTab) => void;

  filter: TasksFilter;
  setFilter: (f: TasksFilter) => void;

  sort: TasksSort;
  setSort: (s: TasksSort) => void;

  tasks: Task[];
  counts: { all: number; TODO: number; IN_PROGRESS: number; COMPLETED: number };

  refresh: () => Promise<void>;

  createTask: (payload: { title: string; description?: string | null; status?: TasksTab; priority?: string | null; assignee?: string | null; label?: string | null; dueDate?: string | null; }) => Promise<Task>;
  updateTask: (id: number, payload: Partial<Task>) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;

  moveTask: (id: number, opts: { toStatus?: TaskStatus; toIndex: number }) => Promise<void>; // drag & drop
}

const TasksContext = createContext<TasksContextValue | undefined>(undefined);

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TasksTab>("all");
  const [filter, setFilter] = useState<TasksFilter>({});
  const [sort, setSort] = useState<TasksSort>({ sort: "createdAt", order: "desc" });
  const [tasks, setTasks] = useState<Task[]>([]);
  const prevTasksRef = useRef<Task[] | null>(null);
  const { healthy, disableWrites } = useApiHealth();

  const counts = useMemo(() => {
    const c = { all: tasks.length, TODO: 0, IN_PROGRESS: 0, COMPLETED: 0 } as const;
    return tasks.reduce((acc: any, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, { ...c });
  }, [tasks]);

  // ---- Local helpers for optimistic reordering ----
  function cloneTasks(src: Task[]) {
    return src.map((t) => ({ ...t }));
  }

  function sortTasksLocal(list: Task[], key: NonNullable<TasksSort["sort"]>, dir: NonNullable<TasksSort["order"]>) {
    const mul = dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      let va: any = (a as any)[key];
      let vb: any = (b as any)[key];
      if (["dueDate", "createdAt", "updatedAt"].includes(key as string)) {
        va = va ? new Date(va).getTime() : 0;
        vb = vb ? new Date(vb).getTime() : 0;
      }
      if (va === vb) return a.id - b.id;
      return (va > vb ? 1 : -1) * mul;
    });
  }

  function normalizeOrders(list: Task[]) {
    // Ensure order is 0..n-1 within each status
    const buckets: Record<string, Task[]> = { TODO: [], IN_PROGRESS: [], COMPLETED: [] } as any;
    for (const t of list) buckets[t.status].push(t);
    for (const status of Object.keys(buckets)) {
      buckets[status].sort((a, b) => (a.order - b.order) || (a.id - b.id));
      buckets[status].forEach((t, i) => (t.order = i));
    }
  }

  function optimisticMove(list: Task[], taskId: number, toStatus: TaskStatus, toIndex: number): Task[] {
    const next = cloneTasks(list);
    const idx = next.findIndex((t) => t.id === taskId);
    if (idx === -1) return list;
    const task = next[idx];
    const fromStatus = task.status;

    // Remove gap in source: decrement order for items after the removed one
    for (const t of next) {
      if (t.status === fromStatus && t.order > task.order) t.order -= 1;
    }

    // Update the moved task's status and provisional order
    task.status = toStatus;

    // Clamp destination index based on current items count in dest column
    const destCount = next.filter((t) => t.status === toStatus).length;
    const clamped = Math.max(0, Math.min(toIndex, destCount));

    // Open gap in destination: increment order for items with order >= clamped
    for (const t of next) {
      if (t.status === toStatus && t.id !== task.id && t.order >= clamped) t.order += 1;
    }

    task.order = clamped;

    // Finally, normalize to be safe
    normalizeOrders(next);

    // Optionally keep global sort visual consistent with current sort settings when tab === 'all'
    if (tab === "all" && sort.sort) {
      return sortTasksLocal(next, sort.sort!, sort.order || "desc");
    }
    return next;
  }

  const refresh = useCallback(async () => {
    if (!healthy) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data } = await listTasks({
        status: tab,
        search: filter.search,
        sort: sort.sort,
        order: sort.order,
      });
      setTasks(data);
    } catch (error) {
      console.error('[tasks] failed to refresh', error);
      setTasks([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [healthy, tab, filter.search, sort.sort, sort.order]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createTask = useCallback(async (payload: { title: string; description?: string | null; status?: TasksTab; priority?: string | null; assignee?: string | null; label?: string | null; dueDate?: string | null; }) => {
    if (disableWrites) {
      throw new Error('Backend unavailable');
    }
    const desiredStatus = (payload.status && payload.status !== "all" ? payload.status : undefined) as TaskStatus | undefined;
    const { data } = await apiCreateTask({ ...payload, status: desiredStatus });
    prevTasksRef.current = tasks;
    setTasks((prev) => {
      const next = [...prev, data];
      // Keep local visual stable
      if (tab === "all" && sort.sort) return sortTasksLocal(next, sort.sort!, sort.order || "desc");
      return next;
    });
    return data;
  }, [disableWrites, tab, tasks]);

  const updateTask = useCallback(async (id: number, payload: Partial<Task>) => {
    if (disableWrites) {
      throw new Error('Backend unavailable');
    }
    const { data } = await apiUpdateTask(id, payload as any);
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    return data;
  }, [disableWrites]);

  const deleteTask = useCallback(async (id: number) => {
    if (disableWrites) {
      throw new Error('Backend unavailable');
    }
    prevTasksRef.current = tasks;
    await apiDeleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, [disableWrites, tasks]);

  const moveTaskCb = useCallback(async (id: number, opts: { toStatus?: TaskStatus; toIndex: number }) => {
    if (disableWrites) {
      throw new Error('Backend unavailable');
    }
    prevTasksRef.current = tasks;
    setTasks((prev) => optimisticMove(prev, id, (opts.toStatus ?? (prev.find(t => t.id === id)?.status || "TODO")) as TaskStatus, Number(opts.toIndex)));

    // Server sync
    try {
      await apiMoveTask(id, { toStatus: opts.toStatus, toIndex: opts.toIndex });
      // Final refresh to reflect normalized ordering from server
      await refresh();
    } catch (e) {
      // Rollback immediately to previous snapshot, then refresh to ensure server truth
      if (prevTasksRef.current) setTasks(prevTasksRef.current);
      await refresh();
      throw e;
    }
  }, [disableWrites, refresh, tasks]);

  const value: TasksContextValue = useMemo(() => ({
    loading,
    tab,
    setTab,

    filter,
    setFilter,

    sort,
    setSort,

    tasks,
    counts: {
      all: tasks.length,
      TODO: tasks.filter((t) => t.status === "TODO").length,
      IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS").length,
      COMPLETED: tasks.filter((t) => t.status === "COMPLETED").length,
    },

    refresh,

    createTask,
    updateTask,
    deleteTask,

    moveTask: moveTaskCb,
  }), [loading, tab, filter, sort, tasks, refresh, createTask, updateTask, deleteTask, moveTaskCb]);

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
};

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be used within a TasksProvider");
  return ctx;
}
