import React from 'react';

import { useTasks as useTasksQuery, useUpdateTask, useDeleteTask } from '../../features/tasks/hooks';
import type { Task } from '../../types';

type ChatMessage = {
  id: string;
  userName: string;
  avatarUrl?: string;
  text: string;
  createdAt: string; // ISO
  isMe?: boolean;
  attachments?: { name: string }[];
};

function formatDueLabel(value?: string | null) {
  if (!value) return 'No due date';
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) return 'No due date';
  try {
    return new Date(ts).toLocaleDateString(undefined, { weekday: 'short' });
  } catch {
    return 'No due date';
  }
}

function getAssigneeInitials(value?: string | null) {
  if (!value) return '—';
  const trimmed = value.trim();
  if (!trimmed) return '—';
  const segments = trimmed.split(/\s+/).filter(Boolean);
  if (!segments.length) return '—';
  if (segments.length === 1) return segments[0].slice(0, 2).toUpperCase();
  const first = segments[0]?.[0] ?? '';
  const last = segments[segments.length - 1]?.[0] ?? '';
  return `${first}${last}`.toUpperCase();
}

function priorityBadgeClass(priority?: string | null) {
  const key = (priority ?? '').toLowerCase();
  if (key === 'high') return 'bg-red-50 text-red-700';
  if (key === 'medium') return 'bg-amber-50 text-amber-700';
  if (key === 'low') return 'bg-emerald-50 text-emerald-700';
  return 'bg-gray-100 text-gray-600';
}

function priorityLabel(priority?: string | null) {
  if (!priority) return null;
  const text = priority.trim();
  if (!text) return null;
  return text.slice(0, 1).toUpperCase() + text.slice(1).toLowerCase();
}

export default function QuickDiscussionTasksBlock({ subtitle }: { subtitle?: string } = {}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [text, setText] = React.useState('');
  const onSend = () => {
    if (!text.trim()) return;
    const messageId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `msg-${Date.now()}`;
    const message: ChatMessage = {
      id: messageId,
      userName: 'You',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isMe: true,
    };
    setMessages((ms) => [...ms, message]);
    setText('');
  };
  const { data: taskList = [], isLoading: loadingTasks, error: tasksError } = useTasksQuery();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [optimisticStatuses, setOptimisticStatuses] = React.useState<Record<number, Task['status']>>({});
  const [pendingTaskId, setPendingTaskId] = React.useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = React.useState<number | null>(null);

  React.useEffect(() => {
    setOptimisticStatuses({});
  }, [taskList]);

  const visibleTasks = React.useMemo(() => {
    const sorted = [...taskList].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return sorted.slice(0, 6);
  }, [taskList]);

  const toggleStatus = React.useCallback((task: Task) => {
    const nextStatus: Task['status'] = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
    setOptimisticStatuses((prev) => ({ ...prev, [task.id]: nextStatus }));
    setPendingTaskId(task.id);
    updateTask.mutate(
      { id: task.id, patch: { status: nextStatus } },
      {
        onError: () => {
          setOptimisticStatuses((prev) => {
            const copy = { ...prev };
            delete copy[task.id];
            return copy;
          });
        },
        onSettled: () => {
          setOptimisticStatuses((prev) => {
            const copy = { ...prev };
            delete copy[task.id];
            return copy;
          });
          setPendingTaskId((prev) => (prev === task.id ? null : prev));
        },
      },
    );
  }, [updateTask]);

  const handleDeleteTask = React.useCallback((task: Task) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Are you sure you want to delete this task?');
      if (!confirmed) return;
    }

    setPendingDeleteId(task.id);
    deleteTask.mutate(task.id, {
      onError: (error) => {
        console.error('[tasks] failed to delete task', error);
      },
      onSettled: () => {
        setPendingDeleteId((prev) => (prev === task.id ? null : prev));
      },
    });
  }, [deleteTask]);

  const renderTaskBody = () => {
    if (loadingTasks) {
      return <div className="p-4 text-sm text-gray-500">Loading tasks…</div>;
    }
    if (tasksError) {
      return <div className="p-4 text-sm text-red-600">Failed to load tasks.</div>;
    }
    if (!visibleTasks.length) {
      return <div className="p-4 text-sm text-gray-500">No tasks yet. <button className="underline">+ New task</button></div>;
    }
    return (
      <>
        {visibleTasks.map((task) => {
          const optimisticStatus = optimisticStatuses[task.id];
          const status = optimisticStatus ?? task.status;
          const completed = status === 'COMPLETED';
          const due = formatDueLabel(task.dueDate);
          const priorityText = priorityLabel(task.priority);
          const assigneeInitials = getAssigneeInitials(task.assignee);
          const disableToggle = pendingTaskId === task.id && updateTask.isPending;
          const deleting = pendingDeleteId === task.id && deleteTask.isPending;

          return (
            <div key={task.id} className="p-3 flex items-start gap-3">
              <input
                aria-label={`Toggle ${task.title}`}
                type="checkbox"
                className="mt-1"
                checked={completed}
                onChange={() => toggleStatus(task)}
                disabled={disableToggle}
              />
              <div className="flex-1">
                <div className={`text-[14.5px] ${completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{task.title}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-gray-500">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-[10px]">{assigneeInitials}</span>
                  <span>{due === 'No due date' ? due : `Due ${due}`}</span>
                  {priorityText ? (
                    <span className={`px-2 py-0.5 rounded-full ${priorityBadgeClass(task.priority)}`}>{priorityText}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 text-[12px]">
                <button aria-label="More" className="text-gray-400">•••</button>
                <button
                  type="button"
                  className="text-rose-600 hover:underline disabled:opacity-50 disabled:pointer-events-none"
                  onClick={() => handleDeleteTask(task)}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          );
        })}
        <div className="p-3 text-[12px] text-gray-500"><button className="underline">Show more</button></div>
      </>
    );
  };

  return (
    <section className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6" aria-label="Quick Discussion & Tasks">
      <div className="mb-4">
        <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Quick Discussion & Tasks</div>
        {subtitle ? <p className="mt-1 text-sm text-gray-500">{subtitle}</p> : null}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Chat */}
        <div className="rounded-xl border bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-[13px] text-gray-500">Discussion</div>
            <div className="flex items-center gap-2 text-xs">
              {['All','Mentions','Files'].map(f => (<span key={f} className="px-2 py-0.5 rounded-full border text-gray-600">{f}</span>))}
            </div>
          </div>
          <div className="h-[340px] overflow-auto px-4 py-3 space-y-4" aria-label="Conversation feed">
            {messages.length===0 && (
              <div className="text-sm text-gray-500">No messages yet. Start the conversation.</div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.isMe?'justify-end':''}`}>
                <div className={`max-w-[78%] ${m.isMe?'text-right':''}`}>
                  <div className="text-[12px] text-gray-500 flex items-center gap-2">
                    <span className="font-medium text-gray-700">{m.userName}</span>
                    <span>{new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                  </div>
                  <div className={`mt-1 inline-block px-3 py-2 rounded-2xl ${m.isMe?'bg-indigo-50 text-indigo-900':'bg-gray-50 text-gray-800'}`}>{m.text}</div>
                  {m.attachments?.length ? (
                    <div className="mt-1 text-[12px] inline-flex items-center gap-2 px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      📎 {m.attachments[0].name}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t px-3 py-2 space-y-1">
            <div className="text-[12px] text-gray-400 px-1">Someone is typing… · · ·</div>
            <div className="flex items-center gap-2">
              <button aria-label="Emoji" className="px-2">😊</button>
              <button aria-label="Attach" className="px-2">📎</button>
              <input className="flex-1 border rounded-full px-3 py-2 text-sm focus:outline-none focus:ring" placeholder="Write a quick note…" value={text} onChange={e=>setText(e.target.value)} />
              <button onClick={onSend} className="px-3 py-2 text-sm rounded bg-indigo-600 text-white">Send</button>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="rounded-xl border bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="text-[13px] text-gray-500">Tasks</div>
            <div className="flex items-center gap-2 text-xs">
              {['All','Open','Done'].map(f => (<span key={f} className="px-2 py-0.5 rounded-full border text-gray-600">{f}</span>))}
              <button className="ml-2 px-2 py-1 rounded border">+ New</button>
            </div>
          </div>
          <div className="divide-y" aria-label="Tasks list">{renderTaskBody()}</div>
        </div>
      </div>
    </section>
  );
}
