import React from "react";
import { ClipboardList, FileText, Loader2, Plus } from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { toast } from "react-hot-toast";
import BaseCard from "../ui/BaseCard";
import { TasksProvider, useTasks } from "../../context/TasksContext";
import type { Task } from "../../types";

type RequestsTasksCardProps = {
  className?: string;
};

type SourceType = "PR" | "RFQ";

type AddTaskPayload = {
  sourceType: SourceType;
  relatedNo: string;
  followUpDetails: string;
  assignee: string;
};

const SOURCE_OPTIONS: Array<{ value: SourceType; label: string; description: string; icon: React.ReactNode }> = [
  {
    value: "PR",
    label: "Purchase Request",
    description: "Follow up on a purchase request",
    icon: <ClipboardList className="h-6 w-6 text-sky-500" />,
  },
  {
    value: "RFQ",
    label: "Quotation",
    description: "Track quotation or vendor follow-ups",
    icon: <FileText className="h-6 w-6 text-purple-500" />,
  },
];

export default function RequestsTasksCard({ className }: RequestsTasksCardProps) {
  return (
    <TasksProvider>
      <RequestsTasksCardContent className={className} />
    </TasksProvider>
  );
}

function RequestsTasksCardContent({ className }: RequestsTasksCardProps) {
  const { tasks, loading, createTask, refresh } = useTasks();
  const [open, setOpen] = React.useState(false);

  const visibleTasks = React.useMemo(() => {
    const toTime = (value?: string | null) => {
      const ts = value ? new Date(value).getTime() : 0;
      return Number.isFinite(ts) ? ts : 0;
    };
    const sorted = [...tasks].sort((a, b) => toTime(b.createdAt) - toTime(a.createdAt));
    return sorted.slice(0, 6);
  }, [tasks]);

  const handleCreate = React.useCallback(
    async ({ sourceType, relatedNo, followUpDetails, assignee }: AddTaskPayload) => {
      const normalizedSource = sourceType;
      const trimmedDetails = followUpDetails.trim();
      const trimmedRelated = relatedNo.trim();
      const trimmedAssignee = assignee.trim();
      const title = `${normalizedSource} • ${trimmedRelated || "N/A"}`;
      const metadata: Record<string, string> = { source: normalizedSource };
      if (trimmedRelated) metadata.relatedNo = trimmedRelated;
      if (trimmedAssignee) metadata.assignee = trimmedAssignee;
      const descriptionParts = [trimmedDetails];
      if (Object.keys(metadata).length) {
        descriptionParts.push("", "---", JSON.stringify(metadata));
      }
      const description = descriptionParts.join("\n").trim();

      await createTask({
        title,
        description,
        status: "TODO",
        assignee: trimmedAssignee || null,
      });
      await refresh();
      toast.success("Task created");
      setOpen(false);
    },
    [createTask, refresh]
  );

  return (
    <>
      <BaseCard
        title="Tasks"
        subtitle="Follow-up actions linked to requests"
        className={`flex h-full min-h-[320px] flex-col ${className ?? ""}`.trim()}
        headerRight={
          <Tooltip.Provider>
            <Tooltip.Root delayDuration={150}>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  aria-label="Add Task"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content side="bottom" className="rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg">
                Add Task
              </Tooltip.Content>
            </Tooltip.Root>
          </Tooltip.Provider>
        }
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          {loading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading tasks…
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">No tasks yet</div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {visibleTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          )}
        </div>
      </BaseCard>

      {open ? <AddTaskDialog open={open} onClose={() => setOpen(false)} onSubmit={handleCreate} /> : null}
    </>
  );
}

type TaskRowProps = {
  task: Task;
};

function TaskRow({ task }: TaskRowProps) {
  const source = (task.title || "").split("•")[0].trim().toUpperCase();
  const badgeTone = source === "RFQ" ? "purple" : "sky";
  const badgeClass =
    badgeTone === "purple"
      ? "border-purple-200 bg-purple-50 text-purple-600"
      : "border-sky-200 bg-sky-50 text-sky-600";

  const detail = (task.description || "").split("\n")[0];

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${badgeClass}`}>
          {source || "TASK"}
        </span>
        {task.assignee ? <span className="text-xs text-gray-500">{task.assignee}</span> : null}
      </div>
      <div className="mt-2 text-sm font-medium text-gray-800 line-clamp-2">{detail || task.title}</div>
      <div className="mt-1 text-xs text-gray-500 line-clamp-1">{task.title}</div>
    </div>
  );
}

type AddTaskDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AddTaskPayload) => Promise<void>;
};

function AddTaskDialog({ open, onClose, onSubmit }: AddTaskDialogProps) {
  const [source, setSource] = React.useState<SourceType>("PR");
  const [relatedNo, setRelatedNo] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    setSource("PR");
    setRelatedNo("");
    setDetails("");
    setAssignee("");
    const timer = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!details.trim()) {
      setError("Follow-up details are required");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ sourceType: source, relatedNo, followUpDetails: details, assignee });
    } catch (err: any) {
      setSaving(false);
      setError(err?.message ?? "Failed to create task");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onClick={onClose}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <header>
            <h2 className="text-lg font-semibold text-gray-900">Add Task</h2>
            <p className="text-sm text-gray-500">Capture follow-up actions for requests or quotations.</p>
          </header>

          <section className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Source Type</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {SOURCE_OPTIONS.map((option) => {
                const active = source === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSource(option.value)}
                    className={`flex h-full flex-col rounded-xl border px-4 py-3 text-left transition ${
                      active ? "border-sky-400 bg-sky-50 shadow" : "border-gray-200 hover:border-sky-300 hover:bg-sky-50/40"
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      {option.icon}
                      <span className="text-sm font-semibold text-gray-900">{option.label}</span>
                    </div>
                    <p className="text-xs text-gray-500">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <label className="block text-sm font-medium text-gray-700">
            Related No (optional)
            <input
              type="text"
              value={relatedNo}
              onChange={(event) => setRelatedNo(event.target.value)}
              placeholder="Request No or Quotation No"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Follow-up Details <span className="text-red-500">*</span>
            <textarea
              ref={textareaRef}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder="e.g. Call vendor, get approval from Ahmed"
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </label>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <label className="block text-sm font-medium text-gray-700">
            Assignee (optional)
            <input
              type="text"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              placeholder="Person responsible"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
            />
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !details.trim()}
              className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating
                </>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
