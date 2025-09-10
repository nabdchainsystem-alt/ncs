import React, { useState } from "react";
import { useTasks } from "../../../context/TasksContext";
import type { TaskStatus } from "../../../types";

export interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  defaultStatus?: TaskStatus | "all";
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
    {children}
  </label>
);

const AddTaskModal: React.FC<AddTaskModalProps> = ({ open, onClose, defaultStatus = "TODO" }) => {
  const { createTask, refresh } = useTasks();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("Medium");
  const [assignee, setAssignee] = useState("");
  const [label, setLabel] = useState("");
  const [dueDate, setDueDate] = useState<string>("");

  if (!open) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    await createTask({
      title: title.trim(),
      description: description.trim() || null,
      status: (defaultStatus === "all" ? "TODO" : defaultStatus) as TaskStatus,
      priority,
      assignee: assignee.trim() || null,
      label: label.trim() || null,
      dueDate: dueDate || null,
    });
    await refresh();
    onClose();
    // reset
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setAssignee("");
    setLabel("");
    setDueDate("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Add New Task</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100">✕</button>
        </div>
        <form onSubmit={handleCreate} className="space-y-4 p-5">
          <Field label="Title">
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Write a clear, concise title"
              required
            />
          </Field>

          <Field label="Description">
            <textarea
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Priority">
              <select
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </Field>

            <Field label="Assignee">
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="e.g. Ali"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Label">
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Backend"
              />
            </Field>

            <Field label="Due date">
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;