import * as React from 'react';
import { useTaskStore } from './TaskStore';
import type { Task, TaskStatus } from './taskTypes';
import Button from '../ui/Button';

type Mode = 'create' | 'edit';

interface TaskModalProps {
  mode: Mode;
  task?: Task;                // مطلوب في حالة edit
  onClose: () => void;
}

export default function TaskModal({ mode, task, onClose }: TaskModalProps) {
  const { addTask, updateTask } = useTaskStore();

  // ---- form state ----
  const [title, setTitle] = React.useState(task?.title ?? '');
  const [status, setStatus] = React.useState<TaskStatus>(task?.status ?? 'To do');
  const [assignee, setAssignee] = React.useState(task?.assignee ?? '');
  const [dueDate, setDueDate] = React.useState(task?.dueDate ?? '');
  const [tagsInput, setTagsInput] = React.useState((task?.tags ?? []).join(', '));
  const [notes, setNotes] = React.useState(task?.description ?? '');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (mode === 'edit' && task) {
      setTitle(task.title ?? '');
      setStatus(task.status ?? 'To do');
      setAssignee(task.assignee ?? '');
      setDueDate(task.dueDate ?? '');
      setTagsInput((task.tags ?? []).join(', '));
      setNotes(task.description ?? '');
    }
  }, [mode, task]);

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
  }

  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        status,
        assignee: assignee.trim() || undefined,
        dueDate: dueDate || undefined,
        tags: parseTags(tagsInput),
        description: notes.trim() || undefined,
      };

      if (mode === 'edit' && task) {
        updateTask(task.id, payload);
      } else {
        // create
        addTask({
          ...payload,
          commentsCount: 0,
        });
      }

      onClose();
    } catch (e) {
      setError('Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onKeyDown={onKeyDown}>
      <div className="w-full max-w-2xl rounded-2xl bg-white border shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="text-sm font-semibold">
            {mode === 'edit' ? 'Edit Task' : 'Add New Task'}
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs text-gray-600">Title <span className="text-red-500">*</span></label>
            <input
              className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus"
              placeholder="e.g. Prepare RFQ for vendor ABC"
              value={title}
              onChange={e => setTitle(e.currentTarget.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-600">Status</label>
              <select
                className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus"
                value={status}
                onChange={e => setStatus(e.currentTarget.value as TaskStatus)}
              >
                {(['To do', 'In Progress', 'Completed'] as TaskStatus[]).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-600">Assignee</label>
              <input
                className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus"
                placeholder="e.g. Nora"
                value={assignee}
                onChange={e => setAssignee(e.currentTarget.value)}
              />
            </div>

            <div>
              <label className="text-xs text-gray-600">Due Date</label>
              <input
                type="date"
                className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus"
                value={formatDateInputValue(dueDate)}
                onChange={e => setDueDate(e.currentTarget.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">Tags (comma separated)</label>
            <input
              className="mt-1 h-10 w-full rounded-xl border px-3 text-sm input-focus"
              placeholder="e.g. Marketing, Urgent"
              value={tagsInput}
              onChange={e => setTagsInput(e.currentTarget.value)}
            />
          </div>

          <div>
            <label className="text-xs text-gray-600">Notes</label>
            <textarea
              className="mt-1 min-h-[96px] w-full rounded-xl border px-3 py-2 text-sm input-focus"
              placeholder="Optional notes..."
              value={notes}
              onChange={e => setNotes(e.currentTarget.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <Button variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button size="md" onClick={handleSave} disabled={saving}>
            {mode === 'edit' ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ------------ helpers ------------- */
function formatDateInputValue(v?: string) {
  if (!v) return '';
  // ensure yyyy-mm-dd for <input type="date">
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}