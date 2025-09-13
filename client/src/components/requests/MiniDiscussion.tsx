import React from 'react';

type Message = { id: string; at: string; user: string; text: string; attachments?: { name: string; size?: number }[] };
type Task = { id: string; title: string; owner: string; status: 'TODO'|'IN_PROGRESS'|'COMPLETED'; due?: string };

export default function MiniDiscussion({ requests }: { requests: Array<{ requestNo: string }> }) {
  const [active, setActive] = React.useState<string>(() => requests[0]?.requestNo || '');
  const [input, setInput] = React.useState('');
  const [file, setFile] = React.useState<File | null>(null);
  const [msgs, setMsgs] = React.useState<Record<string, Message[]>>({});
  const [tasks, setTasks] = React.useState<Record<string, Task[]>>({});

  const pushMsg = () => {
    if (!active) return;
    const text = input.trim();
    if (!text && !file) return;
    const m: Message = { id: crypto.randomUUID?.() || String(Math.random()), at: new Date().toISOString(), user: 'you', text, attachments: file ? [{ name: file.name, size: file.size }] : undefined };
    setMsgs((s) => ({ ...s, [active]: [...(s[active] || []), m] }));
    setInput(''); setFile(null);
  };

  const addTask = () => {
    if (!active) return;
    const t: Task = { id: crypto.randomUUID?.() || String(Math.random()), title: 'Follow-up', owner: 'Unassigned', status: 'TODO', due: new Date(Date.now()+3*86400000).toISOString().slice(0,10) };
    setTasks((s) => ({ ...s, [active]: [...(s[active] || []), t] }));
  };

  const updateTask = (id: string, patch: Partial<Task>) => {
    setTasks((s) => ({ ...s, [active]: (s[active]||[]).map(t => t.id===id? { ...t, ...patch } : t) }));
  };

  return (
    <div className="card card-p">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Discussion + Linked Tasks</div>
        <select className="h-8 rounded-lg border px-2 text-sm" value={active} onChange={(e)=> setActive(e.currentTarget.value)}>
          {requests.map(r => <option key={r.requestNo} value={r.requestNo}>{r.requestNo}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Chat */}
        <div className="lg:col-span-3 rounded-xl border p-3 bg-white">
          <div className="h-56 overflow-auto space-y-2">
            {(msgs[active]||[]).map(m => (
              <div key={m.id} className="rounded-lg border p-2 bg-gray-50">
                <div className="text-xs text-gray-500">{m.user} • {new Date(m.at).toLocaleString()}</div>
                <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                {m.attachments && m.attachments.length ? (
                  <div className="mt-1 text-xs text-gray-600">📎 {m.attachments.map(a => a.name).join(', ')}</div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input value={input} onChange={(e)=>setInput(e.currentTarget.value)} className="flex-1 h-9 rounded-xl border px-3 text-sm input-focus" placeholder="Write a comment…  use @username / @department" />
            <input type="file" className="text-xs" onChange={(e)=> setFile(e.currentTarget.files?.[0] || null)} />
            <button className="px-3 py-2 rounded border text-sm hover:bg-gray-50" onClick={pushMsg}>Send</button>
          </div>
        </div>

        {/* Tasks */}
        <div className="lg:col-span-2 rounded-xl border p-3 bg-white">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-semibold">Linked Tasks</div>
            <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={addTask}>+ Add</button>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600">
                <tr>
                  <th className="px-2 py-2 text-left">Task</th>
                  <th className="px-2 py-2 text-left">Owner</th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Due</th>
                  <th className="px-2 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(tasks[active]||[]).length===0 ? (
                  <tr><td className="px-2 py-4 text-center text-gray-500" colSpan={5}>No tasks</td></tr>
                ) : (tasks[active]||[]).map(t => (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="px-2 py-2">{t.title}</td>
                    <td className="px-2 py-2">
                      <input className="h-8 w-32 rounded border px-2 text-sm" value={t.owner} onChange={(e)=> updateTask(t.id,{ owner:e.currentTarget.value })} />
                    </td>
                    <td className="px-2 py-2">
                      <select className="h-8 rounded border px-2 text-sm" value={t.status} onChange={(e)=> updateTask(t.id, { status: e.currentTarget.value as any })}>
                        {['TODO','IN_PROGRESS','COMPLETED'].map(s=> <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-2 py-2">
                      <input type="date" className="h-8 rounded border px-2 text-sm" value={t.due || ''} onChange={(e)=> updateTask(t.id, { due:e.currentTarget.value })} />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=> updateTask(t.id,{ status:'COMPLETED' })}>Mark Complete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

