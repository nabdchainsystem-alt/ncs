import React, { useEffect, useState } from "react";
import { useTasks } from "../../../context/TasksContext";

export interface FilterSortModalProps {
  open: boolean;
  onClose: () => void;
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
    {children}
  </label>
);

const FilterSortModal: React.FC<FilterSortModalProps> = ({ open, onClose }) => {
  const { filter, sort, setFilter, setSort, refresh } = useTasks();

  const [search, setSearch] = useState(filter.search || "");
  const [assignee, setAssignee] = useState("");
  const [label, setLabel] = useState("");
  const [priority, setPriority] = useState("");

  const [sortKey, setSortKey] = useState<"createdAt" | "dueDate" | "priority" | "order">((sort.sort as any) || "createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(sort.order || "desc");

  useEffect(() => {
    if (open) {
      setSearch(filter.search || "");
    }
  }, [open, filter.search]);

  if (!open) return null;

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setFilter({
      search: search || undefined,
      assignee: assignee || undefined,
      label: label || undefined,
      // priority (كـ label نصي) نقدر نضيفه لاحقًا في الـAPI لو احتجنا
    });
    setSort({
      sort: (sortKey as any) || "createdAt",
      order: sortOrder || "desc",
    });
    await refresh();
    onClose();
  }

  function handleClear() {
    setSearch("");
    setAssignee("");
    setLabel("");
    setPriority("");
    setSortKey("createdAt");
    setSortOrder("desc");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Filter &amp; Sort</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100">✕</button>
        </div>

        <form onSubmit={handleApply} className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Search by title">
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                placeholder="Type to search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Field>

            <Field label="Assignee">
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                placeholder="e.g. Ali"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
            </Field>

            <Field label="Label">
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                placeholder="e.g. Backend"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </Field>

            <Field label="Priority">
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="">Any</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </Field>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 text-sm font-medium text-gray-700">Sort</div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Sort by">
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                  value={sortKey as string}
                  onChange={(e) => setSortKey(e.target.value as "createdAt" | "dueDate" | "priority" | "order")}
                >
                  <option value="createdAt">Created at</option>
                  <option value="dueDate">Due date</option>
                  <option value="priority">Priority</option>
                  <option value="order">Manual order</option>
                </select>
              </Field>

              <Field label="Order">
                <select
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FilterSortModal;