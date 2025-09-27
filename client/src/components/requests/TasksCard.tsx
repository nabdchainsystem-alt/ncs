import React from "react";
import {
  ClipboardList,
  FileText,
  Loader2,
  Plus,
  PackageCheck,
  Boxes,
  PackageSearch,
  Flag,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { toast } from "react-hot-toast";
import BaseCard from "../ui/BaseCard";
import { TasksProvider, useTasks } from "../../context/TasksContext";
import type { Task } from "../../types";
import { listTasks } from "../../lib/api";

type TaskScope = "requests" | "orders" | "inventory" | "overview";
type ReferenceType = "REQUEST" | "RFQ" | "PO" | "INVENTORY" | "GENERAL";

type MentionReference = {
  id: string;
  label: string;
  description?: string;
  type: ReferenceType;
};

type MentionOption = MentionReference & {
  token: string;
};

type SourceOption = {
  value: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
};

type RequestsTasksCardProps = {
  className?: string;
  scope: TaskScope;
  title?: string;
  subtitle?: string;
  references?: MentionReference[];
  sourceOptions?: SourceOption[];
};

type AddTaskPayload = {
  sourceType?: string;
  relatedCode?: string;
  details: string;
  assignee: string;
  mentions: MentionOption[];
  priority: "normal" | "medium" | "urgent";
};

type MentionState = {
  start: number;
  end: number;
  query: string;
};

type TaskCustomMeta = {
  scope?: string;
  sourceType?: string;
  relatedCode?: string;
  mentions?: Array<{ id: string; label: string; type: ReferenceType; token: string }>;
  sequence?: number;
  number?: string;
  priority?: "normal" | "medium" | "urgent";
  completedAt?: string;
};

type ScopeConfig = {
  label: string;
  refType: ReferenceType | null;
  defaultSubtitle: string;
  emptyMessage: string;
  defaultSourceOptions: SourceOption[];
  prefix: string;
};

const SCOPE_CONFIG: Record<TaskScope, ScopeConfig> = {
  requests: {
    label: "requests",
    refType: "REQUEST",
    defaultSubtitle: "Follow-up actions linked to requests",
    emptyMessage: "No request tasks yet",
    defaultSourceOptions: [
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
    ],
    prefix: "PR",
  },
  orders: {
    label: "orders",
    refType: "PO",
    defaultSubtitle: "Follow-up actions linked to purchase orders",
    emptyMessage: "No order tasks yet",
    defaultSourceOptions: [
      {
        value: "PO",
        label: "Purchase Order",
        description: "Monitor PO-level actions",
        icon: <PackageCheck className="h-6 w-6 text-amber-500" />,
      },
    ],
    prefix: "PO",
  },
  inventory: {
    label: "inventory",
    refType: "INVENTORY",
    defaultSubtitle: "Inventory movements and follow-ups",
    emptyMessage: "No inventory tasks yet",
    defaultSourceOptions: [
      {
        value: "INV",
        label: "Inventory",
        description: "Track stock actions and checks",
        icon: <Boxes className="h-6 w-6 text-emerald-500" />,
      },
    ],
    prefix: "INV",
  },
  overview: {
    label: "overview",
    refType: "GENERAL",
    defaultSubtitle: "Cross-functional follow-ups",
    emptyMessage: "No overview tasks yet",
    defaultSourceOptions: [
      {
        value: "TASK",
        label: "General",
        description: "Capture cross-functional follow-ups",
        icon: <PackageSearch className="h-6 w-6 text-slate-500" />,
      },
    ],
    prefix: "OV",
  },
};

const SOURCE_BADGE_CLASS: Record<string, string> = {
  RFQ: "border-purple-200 bg-purple-50 text-purple-600",
  PR: "border-sky-200 bg-sky-50 text-sky-600",
  PO: "border-amber-200 bg-amber-50 text-amber-600",
  INV: "border-emerald-200 bg-emerald-50 text-emerald-600",
  INVENTORY: "border-emerald-200 bg-emerald-50 text-emerald-600",
  GENERAL: "border-slate-200 bg-slate-50 text-slate-600",
  TASK: "border-slate-200 bg-slate-50 text-slate-600",
};

const PRIORITY_META: Record<"normal" | "medium" | "urgent", { label: string; className: string; icon?: React.ReactNode }> = {
  normal: {
    label: "Normal",
    className: "border border-slate-200 bg-slate-100 text-slate-600",
  },
  medium: {
    label: "Medium",
    className: "border border-amber-200 bg-amber-50 text-amber-700",
    icon: <Flag className="h-3.5 w-3.5" />,
  },
  urgent: {
    label: "Urgent",
    className: "border border-red-200 bg-red-50 text-red-600",
    icon: <Flag className="h-3.5 w-3.5" />,
  },
};

const MAX_VISIBLE_TASKS = 6;
const MAX_SUGGESTIONS = 6;
const COMPLETED_HIDE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (value == null) return fallback;
  return String(value);
}

function normalizePriority(raw: unknown): "normal" | "medium" | "urgent" {
  const text = safeString(raw).toLowerCase();
  if (text === "urgent") return "urgent";
  if (text === "medium") return "medium";
  return "normal";
}

function makeToken(type: ReferenceType, label: string, id: string): string {
  const fallback = `${type}-${id}`;
  const base = safeString(label) || fallback;
  const cleaned = base
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const token = (cleaned || fallback).toUpperCase();
  return token.slice(0, 48);
}

function detectMention(value: string, caret: number): MentionState | null {
  const slice = value.slice(0, caret);
  const at = slice.lastIndexOf("@");
  if (at === -1) return null;
  if (at > 0) {
    const prev = slice[at - 1];
    if (prev && !/\s/.test(prev)) return null;
  }
  const query = slice.slice(at + 1);
  if (query.includes("@")) return null;
  if (/[\s\n\t]/.test(query)) return null;
  return { start: at, end: caret, query };
}

function extractMentions(value: string, options: MentionOption[]): MentionOption[] {
  const tokens = new Set<string>();
  const regex = /@([A-Za-z0-9\-]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value)) !== null) {
    tokens.add(match[1].toUpperCase());
  }
  if (!tokens.size) return [];
  return options.filter((option) => tokens.has(option.token));
}

function parseTaskCustom(task: Task): TaskCustomMeta {
  const custom = task.custom && typeof task.custom === "object" ? (task.custom as Record<string, unknown>) : {};
  const scope = safeString(custom.scope).toLowerCase() || undefined;
  const sourceType = safeString(custom.sourceType) || undefined;
  const relatedCode = safeString(custom.relatedCode) || undefined;
  const mentionsRaw = custom.mentions;
  const mentions = Array.isArray(mentionsRaw)
    ? mentionsRaw
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const id = safeString((entry as Record<string, unknown>).id);
          if (!id) return null;
          const label = safeString((entry as Record<string, unknown>).label) || id;
          const typeRaw = safeString((entry as Record<string, unknown>).type).toUpperCase() as ReferenceType;
          const token = safeString((entry as Record<string, unknown>).token) || makeToken(typeRaw, label, id);
          return { id, label, type: typeRaw, token };
        })
        .filter(Boolean) as Array<{ id: string; label: string; type: ReferenceType; token: string }>
    : [];
  const sequenceRaw = custom.sequence;
  const number = safeString(custom.number) || undefined;
  const priority = normalizePriority(custom.priority ?? task.priority);
  const completedAt = safeString(custom.completedAt) || undefined;

  return {
    scope,
    sourceType,
    relatedCode,
    mentions,
    sequence: typeof sequenceRaw === "number" && Number.isFinite(sequenceRaw) ? sequenceRaw : undefined,
    number,
    priority,
    completedAt,
  };
}

function parseSequenceFromTask(task: Task): number | undefined {
  const meta = parseTaskCustom(task);
  if (typeof meta.sequence === "number") return meta.sequence;
  const numberFromMeta = meta.number || safeString(task.title);
  const match = numberFromMeta.match(/^T-[A-Z]+-(\d+)/i);
  if (match) return Number(match[1]);
  return undefined;
}

function buildTaskNumber(prefix: string, sequence: number): string {
  return `T-${prefix}-${sequence}`;
}

type AddTaskDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AddTaskPayload) => Promise<void>;
  sourceOptions: SourceOption[];
  scopeLabel: string;
  references: MentionOption[];
};

function AddTaskDialog({ open, onClose, onSubmit, sourceOptions, scopeLabel, references }: AddTaskDialogProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [source, setSource] = React.useState<string>(sourceOptions[0]?.value ?? scopeLabel.toUpperCase());
  const [relatedCode, setRelatedCode] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [priority, setPriority] = React.useState<"normal" | "medium" | "urgent">("normal");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [mentionState, setMentionState] = React.useState<MentionState | null>(null);
  const [activeSuggestion, setActiveSuggestion] = React.useState(0);

  const mentionOptions = references;
  const selectedMentions = React.useMemo(() => extractMentions(details, mentionOptions), [details, mentionOptions]);

  const suggestions = React.useMemo(() => {
    if (!mentionState) return [];
    const query = mentionState.query.trim().toLowerCase();
    const filtered = mentionOptions.filter((option) =>
      query ? option.token.toLowerCase().includes(query) || option.label.toLowerCase().includes(query) : true,
    );
    return filtered.slice(0, MAX_SUGGESTIONS);
  }, [mentionState, mentionOptions]);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    setSource(sourceOptions[0]?.value ?? scopeLabel.toUpperCase());
    setRelatedCode("");
    setDetails("");
    setAssignee("");
    setPriority("normal");
    setMentionState(null);
    setActiveSuggestion(0);
    const timer = window.setTimeout(() => textareaRef.current?.focus(), 120);
    return () => window.clearTimeout(timer);
  }, [open, scopeLabel, sourceOptions]);

  const handleDetailsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setDetails(value);
    const caret = event.target.selectionStart ?? value.length;
    const nextState = detectMention(value, caret);
    setMentionState(nextState);
    if (!nextState) setActiveSuggestion(0);
  };

  const handleSelectionUpdate = () => {
    const el = textareaRef.current;
    if (!el) return;
    const caret = el.selectionStart ?? el.value.length;
    const nextState = detectMention(el.value, caret);
    setMentionState(nextState);
    if (!nextState) setActiveSuggestion(0);
  };

  const handleSelectSuggestion = React.useCallback(
    (option: MentionOption) => {
      const el = textareaRef.current;
      if (!el || !mentionState) return;
      const { start, end } = mentionState;
      const current = details;
      const before = current.slice(0, start);
      const after = current.slice(end);
      const insertion = `@${option.token} `;
      const nextValue = `${before}${insertion}${after}`;
      setDetails(nextValue);
      setMentionState(null);
      setActiveSuggestion(0);
      requestAnimationFrame(() => {
        if (!textareaRef.current) return;
        const caretPos = before.length + insertion.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(caretPos, caretPos);
      });
      if (!relatedCode.trim()) setRelatedCode(option.label);
    },
    [details, mentionState, relatedCode],
  );

  const handleDetailsKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mentionState || !suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      handleSelectSuggestion(suggestions[activeSuggestion]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setMentionState(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!details.trim()) {
      setError("Task details are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        sourceType: source,
        relatedCode: relatedCode.trim() || undefined,
        details: details.trim(),
        assignee: assignee.trim(),
        mentions: selectedMentions,
        priority,
      });
      setSaving(false);
      onClose();
    } catch (err: any) {
      const message = safeString(err?.message) || "Failed to create task";
      setError(message);
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Add Task</h2>
            <p className="text-xs text-gray-500">Link follow-ups to {scopeLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-gray-500 transition hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {sourceOptions.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {sourceOptions.map((option) => {
                const active = source === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSource(option.value)}
                    className={`flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      active ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                      {option.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{option.label}</div>
                      {option.description ? (
                        <div className="text-xs text-gray-500">{option.description}</div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-600">Related #</span>
              <input
                value={relatedCode}
                onChange={(event) => setRelatedCode(event.target.value)}
                placeholder="e.g. PR-1024"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>
            <label className="block text-sm">
              <span className="text-xs font-medium text-gray-600">Assignee</span>
              <input
                value={assignee}
                onChange={(event) => setAssignee(event.target.value)}
                placeholder="e.g. Ali"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-600">Condition</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as "normal" | "medium" | "urgent")}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="normal">Normal</option>
              <option value="medium">Medium</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-xs font-medium text-gray-600">Task details</span>
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={details}
                onChange={handleDetailsChange}
                onKeyDown={handleDetailsKeyDown}
                onKeyUp={handleSelectionUpdate}
                onClick={handleSelectionUpdate}
                rows={4}
                placeholder="Type the follow-up. Use @ to mention records."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {mentionState && suggestions.length ? (
                <div className="absolute inset-x-0 top-full z-10 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                  {suggestions.map((option, index) => {
                    const active = index === activeSuggestion;
                    return (
                      <button
                        key={`${option.type}-${option.id}`}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          handleSelectSuggestion(option);
                        }}
                        className={`flex w-full items-start gap-3 px-3 py-2 text-left text-sm ${
                          active ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="mt-0.5 text-xs font-semibold text-blue-600">@{option.token}</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{option.label}</div>
                          {option.description ? (
                            <div className="text-xs text-gray-500">{option.description}</div>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </label>

          {selectedMentions.length ? (
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {selectedMentions.map((mention) => (
                <span
                  key={`${mention.type}-${mention.id}`}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600"
                >
                  @{mention.token}
                </span>
              ))}
            </div>
          ) : null}

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type TaskRowProps = {
  task: Task;
  onToggle: (task: Task) => Promise<void>;
  onDelete?: (task: Task) => Promise<void>;
  busy: boolean;
  deleting?: boolean;
};

function TaskRow({ task, onToggle, onDelete, busy, deleting }: TaskRowProps) {
  const meta = parseTaskCustom(task);
  const completed = task.status === "COMPLETED";
  const sourceRaw = safeString(meta.sourceType || task.title.split("•")[0]).trim().toUpperCase() || "TASK";
  const badgeClass = SOURCE_BADGE_CLASS[sourceRaw] || "border-slate-200 bg-slate-50 text-slate-600";
  const assignee = safeString(task.assignee);
  const number = meta.number || safeString(task.title).split("•")[0] || "TASK";
  const priorityKey = normalizePriority(meta.priority ?? task.priority);
  const priorityMeta = PRIORITY_META[priorityKey];
  const detailLine = safeString(task.description).split(/\n+/)[0] || safeString(task.title);

  return (
    <div
      className={`rounded-xl border px-3 py-3 transition ${
        completed
          ? "border-emerald-200 bg-emerald-50"
          : "border-gray-200 bg-gray-50 hover:border-gray-300"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            checked={completed}
            disabled={busy || deleting}
            onChange={() => {
              void onToggle(task);
            }}
          />
          <span className="text-[13px] text-gray-500">{number}</span>
        </label>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badgeClass}`}
          >
            {sourceRaw}
          </span>
          {assignee ? <span className="text-xs text-gray-500">{assignee}</span> : null}
          {onDelete ? (
            <button
              type="button"
              onClick={() => {
                void onDelete(task);
              }}
              disabled={deleting}
              className="text-xs font-medium text-rose-600 hover:underline disabled:pointer-events-none disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          ) : null}
        </div>
      </div>
      <div className={`mt-2 text-sm font-medium ${completed ? "text-emerald-800 line-through" : "text-gray-800"}`}>
        {detailLine}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${priorityMeta.className}`}
        >
          {priorityMeta.icon}
          {priorityMeta.label}
        </span>
        {meta.relatedCode ? <span className="uppercase tracking-wide text-gray-400">#{meta.relatedCode}</span> : null}
        <span className="text-gray-400">Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
      </div>
      {meta.mentions && meta.mentions.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {meta.mentions.map((mention) => (
            <span
              key={`${mention.type}-${mention.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-600"
            >
              @{mention.token}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type ContextualTasksCardProps = RequestsTasksCardProps;

function ContextualTasksCard({
  className,
  scope,
  title,
  subtitle,
  references,
  sourceOptions,
}: ContextualTasksCardProps) {
  const config = SCOPE_CONFIG[scope];
  const {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    refresh,
    filter,
    setFilter,
  } = useTasks();
  const [open, setOpen] = React.useState(false);
  const [completionBusyId, setCompletionBusyId] = React.useState<number | null>(null);
  const [deleteBusyId, setDeleteBusyId] = React.useState<number | null>(null);

  const scopeLabel = config.label;
  const mentionOptions = React.useMemo(() => {
    if (!references?.length) return [] as MentionOption[];
    return references.map((reference) => ({
      ...reference,
      label: reference.label || reference.id,
      description: reference.description,
      token: makeToken(reference.type, reference.label || reference.id, reference.id),
    }));
  }, [references]);

  React.useEffect(() => {
    const currentLabel = (filter.label ?? "").toLowerCase();
    if (currentLabel !== scopeLabel) {
      setFilter((prev) => ({ ...prev, label: scopeLabel }));
    }
  }, [filter.label, scopeLabel, setFilter]);

  const filteredTasks = React.useMemo(() => {
    const now = Date.now();
    return tasks.filter((task) => {
      const meta = parseTaskCustom(task);
      if (task.status !== "COMPLETED") return true;
      const timestamp = meta.completedAt
        ? Date.parse(meta.completedAt)
        : Date.parse(task.updatedAt);
      if (Number.isNaN(timestamp)) return true;
      return now - timestamp < COMPLETED_HIDE_AFTER_MS;
    });
  }, [tasks]);

  const visibleTasks = React.useMemo(() => {
    const scoped = filteredTasks.filter((task) => {
      const label = safeString(task.label).toLowerCase();
      if (label === scopeLabel) return true;
      const meta = parseTaskCustom(task);
      return meta.scope === scopeLabel;
    });
    scoped.sort((a, b) => {
      const seqA = parseSequenceFromTask(a) ?? 0;
      const seqB = parseSequenceFromTask(b) ?? 0;
      if (seqA !== seqB) return seqB - seqA;
      const timeA = Date.parse(a.createdAt) || 0;
      const timeB = Date.parse(b.createdAt) || 0;
      return timeB - timeA;
    });
    return scoped.slice(0, MAX_VISIBLE_TASKS);
  }, [filteredTasks, scopeLabel]);

  const currentSourceOptions = sourceOptions && sourceOptions.length ? sourceOptions : config.defaultSourceOptions;

  const fetchNextSequence = React.useCallback(async () => {
    try {
      const response = await listTasks({ sort: "createdAt", order: "desc", status: "all" });
      const records = Array.isArray(response?.data) ? response.data : [];
      const highest = records.reduce((max, task) => {
        const seq = parseSequenceFromTask(task);
        return seq && seq > max ? seq : max;
      }, 0);
      return highest + 1;
    } catch (error) {
      const fallback = tasks.reduce((max, task) => {
        const seq = parseSequenceFromTask(task);
        return seq && seq > max ? seq : max;
      }, 0);
      return fallback + 1;
    }
  }, [tasks]);

  const handleCreate = React.useCallback(
    async (payload: AddTaskPayload) => {
      const normalizedSource = safeString(payload.sourceType || currentSourceOptions[0]?.value || scopeLabel)
        .trim()
        .toUpperCase();
      const relatedCode = safeString(payload.relatedCode).trim();
      const description = payload.details.trim();
      const assignee = payload.assignee.trim();
      if (!description) {
        throw new Error("Task details are required");
      }
      const sequence = await fetchNextSequence();
      const taskNumber = buildTaskNumber(config.prefix, sequence);
      const mentionsMeta = payload.mentions.map((mention) => ({
        id: mention.id,
        label: mention.label,
        type: mention.type,
        token: mention.token,
      }));
      const primaryMention = payload.mentions.find((mention) =>
        config.refType && config.refType !== "GENERAL" ? mention.type === config.refType : true,
      );
      const refIdRaw = primaryMention ? Number(primaryMention.id) : Number(relatedCode.replace(/[^\d]/g, ""));
      const refId = Number.isFinite(refIdRaw) ? Number(refIdRaw) : null;
      const priority = payload.priority;
      const titleText = relatedCode ? `${taskNumber} • ${normalizedSource} ${relatedCode}` : `${taskNumber} • ${normalizedSource}`;

      await createTask({
        title: titleText,
        description,
        assignee: assignee || null,
        label: scopeLabel,
        priority: priority === "normal" ? "Normal" : priority === "medium" ? "Medium" : "Urgent",
        refType: config.refType === "GENERAL" ? null : config.refType,
        refId,
        custom: {
          scope: scopeLabel,
          sourceType: normalizedSource,
          relatedCode: relatedCode || undefined,
          mentions: mentionsMeta,
          sequence,
          number: taskNumber,
          priority,
        },
      });
      await refresh();
      toast.success("Task created");
      setOpen(false);
    },
    [config.prefix, config.refType, createTask, currentSourceOptions, fetchNextSequence, refresh, scopeLabel],
  );

  const handleToggleComplete = React.useCallback(
    async (task: Task) => {
      const nextStatus = task.status === "COMPLETED" ? "TODO" : "COMPLETED";
      setCompletionBusyId(task.id);
      const meta = parseTaskCustom(task);
      const nextCustom: Record<string, unknown> = {
        ...task.custom,
        completedAt: nextStatus === "COMPLETED" ? new Date().toISOString() : undefined,
        priority: meta.priority,
        sequence: meta.sequence,
        number: meta.number,
        scope: meta.scope,
        sourceType: meta.sourceType,
        relatedCode: meta.relatedCode,
        mentions: meta.mentions,
      };
      if (nextStatus !== "COMPLETED") {
        delete nextCustom.completedAt;
      }
      try {
        await updateTask(task.id, {
          status: nextStatus,
          custom: nextCustom,
          priority: meta.priority ? PRIORITY_META[meta.priority].label : task.priority,
        });
        await refresh();
        toast.success(nextStatus === "COMPLETED" ? "Task completed" : "Task reopened");
      } catch (error: any) {
        toast.error(safeString(error?.message) || "Failed to update task");
      } finally {
        setCompletionBusyId((prev) => (prev === task.id ? null : prev));
      }
    },
    [refresh, updateTask],
  );

  const handleDeleteTask = React.useCallback(
    async (task: Task) => {
      if (typeof window !== "undefined") {
        const confirmed = window.confirm("Are you sure you want to delete this task?");
        if (!confirmed) return;
      }

      setDeleteBusyId(task.id);
      try {
        await deleteTask(task.id);
        toast.success("Task deleted");
      } catch (error: any) {
        toast.error(safeString(error?.message) || "Failed to delete task");
      } finally {
        setDeleteBusyId((prev) => (prev === task.id ? null : prev));
      }
    },
    [deleteTask],
  );

  const effectiveTitle = title ?? "Tasks";
  const effectiveSubtitle = subtitle ?? config.defaultSubtitle;

  return (
    <>
      <BaseCard
        title={effectiveTitle}
        subtitle={effectiveSubtitle}
        className={`flex h-full min-h-[320px] flex-col ${className ?? ""}`.trim()}
        headerRight={
          <Tooltip.Provider>
            <Tooltip.Root delayDuration={150}>
              <Tooltip.Trigger asChild>
                <button
                  type="button"
                  onClick={() => setOpen(true)}
                  aria-label="Add Task"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="flex flex-1 items-center justify-center text-sm text-gray-500">{config.emptyMessage}</div>
          ) : (
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {visibleTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={handleToggleComplete}
                  onDelete={handleDeleteTask}
                  busy={completionBusyId === task.id}
                  deleting={deleteBusyId === task.id}
                />
              ))}
            </div>
          )}
        </div>
      </BaseCard>

      {open ? (
        <AddTaskDialog
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={handleCreate}
          sourceOptions={currentSourceOptions}
          scopeLabel={scopeLabel}
          references={mentionOptions}
        />
      ) : null}
    </>
  );
}

export default function RequestsTasksCard(props: RequestsTasksCardProps) {
  return (
    <TasksProvider>
      <ContextualTasksCard {...props} />
    </TasksProvider>
  );
}
