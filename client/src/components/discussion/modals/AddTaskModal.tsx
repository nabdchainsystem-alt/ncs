import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useTasks } from "../../../context/TasksContext";
import { useApiHealth } from "../../../context/ApiHealthContext";
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
  const { disableWrites } = useApiHealth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("Medium");
  const [assignee, setAssignee] = useState("");
  const [label, setLabel] = useState("");
  const [dueDate, setDueDate] = useState<string>("");

  // Extra rich fields
  const [tags, setTags] = useState<string>("");
  const [estimateHrs, setEstimateHrs] = useState<string>("");
  const [points, setPoints] = useState<string>("");
  const [watchers, setWatchers] = useState<string>("");
  const [relatedRequest, setRelatedRequest] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [checklist, setChecklist] = useState<string[]>([]);
  const [newCheck, setNewCheck] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);

  // Prefill with helpful defaults when opened
  React.useEffect(() => {
    if (!open) return;
    setTitle((prev) => prev || "Follow up RFQ for REQ-" + String(Date.now()).slice(-5));
    setDescription((prev) => prev || "Ensure vendor responses are compared and award prepared.");
    setPriority((prev) => prev || "High");
    setAssignee((prev) => prev || "Ali");
    setLabel((prev) => prev || "Procurement");
    if (!dueDate) {
      const d = new Date(Date.now() + 3*86400000); // +3 days
      setDueDate(d.toISOString().slice(0,10));
    }
    setTags((prev)=> prev || "rfq, vendor, quotation");
    setEstimateHrs((prev)=> prev || "6");
    setPoints((prev)=> prev || "3");
    setWatchers((prev)=> prev || "Sara, Omar");
    setRelatedRequest((prev)=> prev || "REQ-1005");
    setLinkUrl((prev)=> prev || "https://drive.example.com/file/abc" );
    setChecklist((prev)=> prev.length? prev : ["Collect 3 quotes","Compare prices","Prepare award memo"]);
  }, [open]);

  if (!open) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (disableWrites) {
      toast.error("Backend unavailable");
      return;
    }
    if (!title.trim()) return;

    // Merge extra fields into description as a metadata footer
    const extras: string[] = [];
    if (tags.trim()) extras.push(`Tags: ${tags}`);
    if (estimateHrs) extras.push(`Estimate: ${estimateHrs}h`);
    if (points) extras.push(`Points: ${points}`);
    if (watchers.trim()) extras.push(`Watchers: ${watchers}`);
    if (relatedRequest.trim()) extras.push(`Related: ${relatedRequest}`);
    if (linkUrl.trim()) extras.push(`Link: ${linkUrl}`);
    if (checklist.length) extras.push(`Checklist: ${checklist.join(" | ")}`);
    if (files.length) extras.push(`Files: ${files.map(f=>f.name).join(', ')}`);
    const descCombined = [description.trim(), '', '---', ...extras].filter(Boolean).join('\n');

    await createTask({
      title: title.trim(),
      description: descCombined || null,
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
    setTags(""); setEstimateHrs(""); setPoints(""); setWatchers(""); setRelatedRequest(""); setLinkUrl(""); setChecklist([]); setNewCheck(""); setFiles([]);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">Add New Task</h3>
          <button onClick={onClose} className="rounded-md px-2 py-1 text-gray-600 hover:bg-gray-100">✕</button>
        </div>
        {disableWrites ? (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2 text-xs font-medium text-amber-700">
            Backend unavailable. Creating tasks is disabled.
          </div>
        ) : null}
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

          {/* Rich extras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tags (comma separated)">
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600" value={tags} onChange={(e)=> setTags(e.target.value)} />
            </Field>
            <Field label="Estimate (hours)">
              <input type="number" min={0} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600" value={estimateHrs} onChange={(e)=> setEstimateHrs(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Story Points">
              <input type="number" min={0} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600" value={points} onChange={(e)=> setPoints(e.target.value)} />
            </Field>
            <Field label="Watchers">
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600" value={watchers} onChange={(e)=> setWatchers(e.target.value)} placeholder="e.g. Sara, Omar" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Related Request">
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600" value={relatedRequest} onChange={(e)=> setRelatedRequest(e.target.value)} placeholder="REQ-1234" />
            </Field>
            <Field label="External Link">
              <input type="url" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600" value={linkUrl} onChange={(e)=> setLinkUrl(e.target.value)} placeholder="https://…" />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Checklist">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <input className="h-9 rounded-lg border px-3 text-sm flex-1" value={newCheck} onChange={(e)=> setNewCheck(e.target.value)} placeholder="Add item" />
                  <button type="button" className="px-3 py-2 rounded border text-sm" onClick={()=> { if(!newCheck.trim()) return; setChecklist(prev=> [...prev, newCheck.trim()]); setNewCheck(''); }}>+ Add</button>
                </div>
                {checklist.length>0 && (
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {checklist.map((c,i)=> (
                      <li key={i} className="flex items-center justify-between">
                        <span>{c}</span>
                        <button type="button" className="text-xs text-red-600" onClick={()=> setChecklist(prev=> prev.filter((_,j)=> j!==i))}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Field>
            <Field label="Attachments (names only)">
              <input type="file" multiple onChange={(e)=> setFiles(Array.from(e.currentTarget.files || []))} className="block w-full text-sm" />
              {files.length>0 && <div className="mt-1 text-xs text-gray-600">{files.map(f=> f.name).join(', ')}</div>}
            </Field>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={disableWrites}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTaskModal;
