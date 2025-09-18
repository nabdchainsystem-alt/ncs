import * as React from 'react';
import type { BoardHistoryEntry, BoardNode } from '../../types/board';
import Button from '../ui/Button';

const STATUS_OPTIONS = ['Draft', 'Pending', 'Approved', 'Done'];

export type InspectorPanelProps = {
  open: boolean;
  node: BoardNode | null;
  linkedNodes: BoardNode[];
  onClose: () => void;
  onSave: (updates: Partial<BoardNode>) => void;
  onNavigateToNode: (id: string) => void;
  owners: { id: string; name: string }[];
};

type DraftState = {
  title: string;
  body: string;
  owner: string;
  dueDate: string;
  status: string;
  dept: string;
};

function formatTimestamp(entry: BoardHistoryEntry) {
  return new Date(entry.timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function InspectorPanel({
  open,
  node,
  linkedNodes,
  onClose,
  onSave,
  onNavigateToNode,
  owners,
}: InspectorPanelProps) {
  const [draft, setDraft] = React.useState<DraftState | null>(null);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (!node) {
      setDraft(null);
      setDirty(false);
      return;
    }
    setDraft({
      title: node.title,
      body: node.body ?? '',
      owner: node.owner ?? '',
      dueDate: node.dueDate ?? '',
      status: node.status ?? 'Draft',
      dept: node.dept ?? 'General',
    });
    setDirty(false);
  }, [node]);

  const handleField = <K extends keyof DraftState>(key: K, value: DraftState[K]) => {
    setDraft((prev) => {
      if (!prev) return prev;
      setDirty(true);
      return { ...prev, [key]: value };
    });
  };

  if (!node || !draft) {
    return null;
  }

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-40 transition ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!open}
    >
      <div
        className={`board-inspector-backdrop absolute inset-0 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        className={`board-inspector pointer-events-auto absolute right-0 top-0 h-full transform transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="complementary"
        aria-label="Node details inspector"
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-800">Card details</h2>
              <p className="text-xs text-gray-500">Edit the selected node and review its timeline.</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-gray-600" onClick={onClose}>
              Close
            </Button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <form
              className="space-y-4 text-sm"
              onSubmit={(event) => {
                event.preventDefault();
                onSave({
                  title: draft.title,
                  body: draft.body,
                  owner: draft.owner,
                  dueDate: draft.dueDate,
                  status: draft.status,
                  dept: draft.dept,
                });
                setDirty(false);
              }}
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Title</label>
                <input
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                  value={draft.title}
                  onChange={(event) => handleField('title', event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Summary</label>
                <textarea
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                  rows={4}
                  value={draft.body}
                  onChange={(event) => handleField('body', event.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Owner</span>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                    value={draft.owner}
                    onChange={(event) => handleField('owner', event.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {owners.map((owner) => (
                      <option key={owner.id} value={owner.name}>
                        {owner.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Department</span>
                  <input
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                    value={draft.dept}
                    onChange={(event) => handleField('dept', event.target.value)}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Due date</span>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                    value={draft.dueDate}
                    onChange={(event) => handleField('dueDate', event.target.value)}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</span>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none"
                    value={draft.status}
                    onChange={(event) => handleField('status', event.target.value)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Linked nodes</h3>
                {linkedNodes.length === 0 ? (
                  <p className="text-xs text-gray-500">No linked nodes yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {linkedNodes.map((linked) => (
                      <li key={linked.id}>
                        <button
                          type="button"
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold text-gray-600 transition hover:border-primary-400 hover:text-primary-600"
                          onClick={() => onNavigateToNode(linked.id)}
                        >
                          {linked.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Activity history</h3>
                <ul className="space-y-2">
                  {(node.history ?? []).slice(0, 10).map((entry) => (
                    <li key={entry.id} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <div className="text-[11px] font-semibold text-gray-700">{entry.summary}</div>
                      <div className="text-[11px] text-gray-400">{formatTimestamp(entry)}</div>
                    </li>
                  ))}
                  {(node.history ?? []).length === 0 ? (
                    <li className="text-xs text-gray-500">No history recorded yet.</li>
                  ) : null}
                </ul>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 text-sm text-gray-600"
                  onClick={() => {
                    if (!node) return;
                    setDraft({
                      title: node.title,
                      body: node.body ?? '',
                      owner: node.owner ?? '',
                      dueDate: node.dueDate ?? '',
                      status: node.status ?? 'Draft',
                      dept: node.dept ?? 'General',
                    });
                    setDirty(false);
                  }}
                  disabled={!dirty}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" variant="primary" className="h-9 px-4 text-sm" disabled={!dirty}>
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default InspectorPanel;
