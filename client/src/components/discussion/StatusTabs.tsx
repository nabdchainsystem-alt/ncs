

import React from "react";
import { useTasks } from "../../context/TasksContext";
import type { TaskStatus } from "../../types";

export type StatusTabsProps = {
  className?: string;
};

const Pill: React.FC<{ active?: boolean; onClick?: () => void; children: React.ReactNode }>
= ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition
      ${active ? "border-blue-600 text-blue-700 bg-blue-50" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
  >
    {children}
  </button>
);

const Badge: React.FC<{ active?: boolean; children: React.ReactNode }>
= ({ active, children }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
    active ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
  }`}>{children}</span>
);

/**
 * Status Tabs with counters: All / To do / In Progress / Completed
 * Uses TasksContext to read current tab, counts, and setter.
 */
const StatusTabs: React.FC<StatusTabsProps> = ({ className = "" }) => {
  const { tab, setTab, counts } = useTasks();

  const tabs: { key: "all" | TaskStatus; label: string; count: number }[] = [
    { key: "all", label: "All Tasks", count: counts.all },
    { key: "TODO", label: "To do", count: counts.TODO },
    { key: "IN_PROGRESS", label: "In Progress", count: counts.IN_PROGRESS },
    { key: "COMPLETED", label: "Completed", count: counts.COMPLETED },
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map((t) => (
        <Pill key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
          <span>{t.label}</span>
          <Badge active={tab === t.key}>{t.count}</Badge>
        </Pill>
      ))}
    </div>
  );
};

export default StatusTabs;