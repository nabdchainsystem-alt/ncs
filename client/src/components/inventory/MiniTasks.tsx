import React from 'react';

type Row = { id: string; title: string; owner: string; status: 'TODO'|'IN_PROGRESS'|'COMPLETED'; due?: string };

export default function InventoryMiniTasks() {
  const [active, setActive] = React.useState<string>('');
  const [tasks, setTasks] = React.useState<Record<string, Row[]>>({});
  const [title, setTitle] = React.useState('');

  const add = () => {
    if (!active || !title.trim()) return;
    const id = (globalThis.crypto as any)?.randomUUID ? (globalThis.crypto as any).randomUUID() : String(Math.random());
    const due = new Date(Date.now()+3*86400000).toISOString().slice(0,10);
    const row: Row = { id, title: title.trim(), owner: 'Unassigned', status: 'TODO', due };
    setTasks(s => ({ ...s, [active]: [ ...(s[active]||[]), row ] }));
    setTitle('');
  };

  return (
    <div className="u-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Tasks</div>
        <input value={active} onChange={(e)=> setActive(e.currentTarget.value)} className="h-9 rounded-xl border px-3 text-sm" placeholder="Active Item Code" />
      </div>
      <div className="mb-2 flex items-center gap-2">
        <input value={title} onChange={(e)=> setTitle(e.currentTarget.value)} className="h-9 rounded-xl border px-3 text-sm flex-1" placeholder="New task title" />
        <button className="px-3 py-2 rounded border text-sm hover:bg-gray-50" onClick={add}>+ Add</button>
      </div>
      <div className="overflow-auto">
        <table className="u-table text-sm">
          <thead><tr><th>Task</th><th>Owner</th><th>Status</th><th>Due</th></tr></thead>
          <tbody>
            {(tasks[active]||[]).map(t=> (
              <tr key={t.id}><td>{t.title}</td><td>{t.owner}</td><td>{t.status}</td><td>{t.due || '—'}</td></tr>
            ))}
            {(tasks[active]||[]).length===0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">No tasks</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

