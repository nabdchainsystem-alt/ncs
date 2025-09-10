

import React from "react";

export type ViewMode = "list" | "kanban";

export interface ViewSwitchProps {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
  className?: string;
}

/**
 * TailAdmin-like segmented control to switch between List and Kanban views.
 */
const ViewSwitch: React.FC<ViewSwitchProps> = ({ mode, onChange, className = "" }) => {
  return (
    <div className={`inline-flex rounded-lg border border-gray-300 overflow-hidden ${className}`}>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={`px-3 py-1.5 text-sm transition ${
          mode === "list" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50 text-gray-700"
        }`}
      >
        List
      </button>
      <button
        type="button"
        onClick={() => onChange("kanban")}
        className={`px-3 py-1.5 text-sm transition border-l border-gray-300 ${
          mode === "kanban" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50 text-gray-700"
        }`}
      >
        Kanban
      </button>
    </div>
  );
};

export default ViewSwitch;