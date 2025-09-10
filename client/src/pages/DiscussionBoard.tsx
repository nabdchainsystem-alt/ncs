import React, { useMemo, useState } from "react";
import { TasksProvider, useTasks } from "../context/TasksContext";
import type { Task, TaskStatus } from "../types";

// --- Small UI helpers (Tailwind classes aligned with our design system) ---
const Badge: React.FC<{ color?: "gray" | "blue" | "green" | "amber"; children: React.ReactNode }> = ({ color = "gray", children }) => {
  const map: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[color]}`}>{children}</span>;
};

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" }> = ({ variant = "outline", className = "", ...props }) => {
  const base = "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-1";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-600",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300",
  } as const;
  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />;
};

// --- Tabs & View Switch ---
const Tabs: React.FC = () => {
  const { tab, setTab, counts } = useTasks();
  const tabs: { key: "all" | TaskStatus; label: string; count: number }[] = [
    { key: "all", label: "All Tasks", count: counts.all },
    { key: "TODO", label: "To do", count: counts.TODO },
    { key: "IN_PROGRESS", label: "In Progress", count: counts.IN_PROGRESS },
    { key: "COMPLETED", label: "Completed", count: counts.COMPLETED },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
            tab === t.key ? "border-blue-600 text-blue-700 bg-blue-50" : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span>{t.label}</span>
          <Badge color={tab === t.key ? "blue" : "gray"}>{t.count}</Badge>
        </button>
      ))}
    </div>
  );
};

const ViewSwitch: React.FC<{ mode: "list" | "kanban"; setMode: (m: "list" | "kanban") => void }> = ({ mode, setMode }) => (
  <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
    <button onClick={() => setMode("list")} className={`px-3 py-1.5 text-sm ${mode === "list" ? "bg-gray-100" : "hover:bg-gray-50"}`}>List</button>
    <button onClick={() => setMode("kanban")} className={`px-3 py-1.5 text-sm ${mode === "kanban" ? "bg-gray-100" : "hover:bg-gray-50"}`}>Kanban</button>
  </div>
);

// --- List View (grouped sections like TailAdmin) ---
const Section: React.FC<{ title: string; items: Task[]; color: "gray" | "blue" | "green" }>
  = ({ title, items, color }) => (
  <div className="rounded-xl border border-gray-200 bg-white">
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <div className="flex items-center gap-3">
        <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <Badge color={color}>{items.length}</Badge>
      </div>
    </div>
    <ul className="divide-y divide-gray-200">
      {items.map((t) => (
        <li key={t.id} className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
            <div>
              <div className="text-sm font-medium text-gray-900">{t.title}</div>
              {t.description ? <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{t.description}</div> : null}
              <div className="flex items-center gap-2 mt-2">
                {t.label ? <Badge>{t.label}</Badge> : null}
                {t.priority ? <Badge color="amber">{t.priority}</Badge> : null}
                {t.assignee ? <Badge color="blue">{t.assignee}</Badge> : null}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => alert(`Open task #${t.id}`)}>Open</Button>
            <Button variant="outline" onClick={() => alert("More actions…")}>•••</Button>
          </div>
        </li>
      ))}
      {items.length === 0 && (
        <li className="px-4 py-8 text-sm text-gray-500 text-center">No tasks</li>
      )}
    </ul>
  </div>
);

const ListView: React.FC = () => {
  const { tasks } = useTasks();
  const groups = useMemo(() => ({
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    COMPLETED: tasks.filter((t) => t.status === "COMPLETED"),
  }), [tasks]);
  return (
    <div className="space-y-6">
      <Section title="To do" items={groups.TODO} color="gray" />
      <Section title="In Progress" items={groups.IN_PROGRESS} color="blue" />
      <Section title="Completed" items={groups.COMPLETED} color="green" />
    </div>
  );
};

// --- Kanban placeholder (we'll wire DnD in a later step) ---
const KanbanView: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {["TODO", "IN_PROGRESS", "COMPLETED"].map((col) => (
        <div key={col} className="rounded-xl border border-gray-200 bg-white p-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">{col === "TODO" ? "To do" : col === "IN_PROGRESS" ? "In Progress" : "Completed"}</h3>
          </div>
          <div className="text-xs text-gray-500">Drag & Drop coming next…</div>
        </div>
      ))}
    </div>
  );
};

const BoardContent: React.FC = () => {
  const { loading, createTask, refresh } = useTasks();
  const [mode, setMode] = useState<"list" | "kanban">("list");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-gray-900">Discussion Board</h1>
          <div className="text-sm text-gray-500">Tasks (List & Kanban)</div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => alert("Filter & Sort modal (next step)")}>Filter & Sort</Button>
          <Button variant="primary" onClick={async () => {
            const title = window.prompt("Task title");
            if (!title) return;
            await createTask({ title });
            await refresh();
          }}>Add New Task</Button>
        </div>
      </div>

      {/* Tabs & View switch */}
      <div className="flex items-center justify-between">
        <Tabs />
        <ViewSwitch mode={mode} setMode={setMode} />
      </div>

      {/* Content */}
      <div>{mode === "list" ? <ListView /> : <KanbanView />}</div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}
    </div>
  );
};

const DiscussionBoardPage: React.FC = () => {
  return (
    <TasksProvider>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <BoardContent />
      </div>
    </TasksProvider>
  );
};

export default DiscussionBoardPage;
