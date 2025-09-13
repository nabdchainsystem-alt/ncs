import React from 'react';

export default function MiniDiscussionInv() {
  const [active, setActive] = React.useState<string>('');
  const [msgs, setMsgs] = React.useState<Record<string, { id:string; at:string; user:string; text:string }[]>>({});
  const [tasks, setTasks] = React.useState<Record<string, { id:string; title:string; owner:string; status:'TODO'|'IN_PROGRESS'|'COMPLETED'; due?:string }[]>>({});
  const [txt, setTxt] = React.useState('');

  const send = () => {
    if(!active || !txt.trim()) return;
    const m = { id: crypto.randomUUID?.() || String(Math.random()), at: new Date().toISOString(), user: 'you', text: txt.trim() };
    setMsgs(s => ({ ...s, [active]: [ ...(s[active]||[]), m ] }));
    setTxt('');
  };
  const addTask = () => {
    if(!active) return;
    const t = { id: crypto.randomUUID?.() || String(Math.random()), title:'Reorder', owner:'Unassigned', status:'TODO' as const, due: new Date(Date.now()+3*86400000).toISOString().slice(0,10) };
    setTasks(s => ({ ...s, [active]: [ ...(s[active]||[]), t ] }));
  };

  return (
    <div className="u-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Mini Discussion + Tasks</div>
        <input value={active} onChange={(e)=> setActive(e.currentTarget.value)} className="h-9 rounded-xl border px-3 text-sm" placeholder="Active Item Code (e.g., BRG-6204)" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="rounded-xl border bg-white p-2">
          <div className="h-40 overflow-auto space-y-2">
            {(msgs[active]||[]).map(m=> (
              <div key={m.id} className="rounded-lg border p-2 bg-gray-50">
                <div className="text-xs text-gray-500">{m.user} • {new Date(m.at).toLocaleString()}</div>
                <div className="text-sm">{m.text}</div>
              </div>
            ))}
            {(msgs[active]||[]).length===0 && <div className="text-sm text-gray-500">Start a discussion for this item…</div>}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input value={txt} onChange={(e)=> setTxt(e.currentTarget.value)} className="flex-1 h-9 rounded-xl border px-3 text-sm" placeholder="Write a message…" />
            <button className="px-3 py-2 rounded border text-sm" onClick={send}>Send</button>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-2">
          <div className="mb-2 flex items-center justify-between"><div className="text-sm font-semibold">Tasks</div><button className="px-2 py-1 text-xs rounded border" onClick={addTask}>+ Add</button></div>
          <table className="u-table text-sm">
            <thead><tr><th>Task</th><th>Owner</th><th>Status</th><th>Due</th></tr></thead>
            <tbody>
              {(tasks[active]||[]).map(t=> (<tr key={t.id}><td>{t.title}</td><td>{t.owner}</td><td>{t.status}</td><td>{t.due||'—'}</td></tr>))}
              {(tasks[active]||[]).length===0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">No tasks</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

