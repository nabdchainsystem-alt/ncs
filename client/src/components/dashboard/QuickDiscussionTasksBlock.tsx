import React from 'react';

type Message = {
  id: string;
  userName: string;
  avatarUrl?: string;
  text: string;
  createdAt: string; // ISO
  isMe?: boolean;
  attachments?: { name: string }[];
};

type Task = {
  id: string;
  title: string;
  completed: boolean;
  assignee: { name: string; avatarUrl?: string };
  dueDate: string; // ISO
  priority: 'High' | 'Medium' | 'Low';
};

export default function QuickDiscussionTasksBlock() {
  // Mock data (replace with real later)
  const [messages, setMessages] = React.useState<Message[]>([
    { id: 'm1', userName: 'Maya', text: 'Please confirm inbound for WH‑A tomorrow.', createdAt: new Date(Date.now()-3600e3).toISOString(), isMe: false },
    { id: 'm2', userName: 'You', text: 'Confirmed. Carrier booked 9:30 AM.', createdAt: new Date(Date.now()-1800e3).toISOString(), isMe: true, attachments: [{ name: 'carrier-booking.pdf' }] },
  ]);
  const [text, setText] = React.useState('');
  const onSend = () => {
    if (!text.trim()) return;
    setMessages(ms => [...ms, { id: crypto.randomUUID(), userName: 'You', text: text.trim(), createdAt: new Date().toISOString(), isMe: true }]);
    setText('');
  };

  const [tasks, setTasks] = React.useState<Task[]>([
    { id: 't1', title: 'Follow up with Alpha Co. on PO-2049', completed: false, assignee: { name: 'MA' }, dueDate: new Date(Date.now()+86400e3).toISOString(), priority: 'High' },
    { id: 't2', title: 'Upload September vendor invoices', completed: false, assignee: { name: 'IT' }, dueDate: new Date(Date.now()+2*86400e3).toISOString(), priority: 'Medium' },
    { id: 't3', title: 'Review RFQ specs for Maintenance', completed: true, assignee: { name: 'OP' }, dueDate: new Date(Date.now()-86400e3).toISOString(), priority: 'Low' },
  ]);
  const toggle = (id: string) => setTasks(ts => ts.map(t => t.id===id ? { ...t, completed: !t.completed } : t));

  const priColor = (p: Task['priority']) => p==='High' ? 'bg-red-50 text-red-700' : p==='Medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';

  return (
    <section className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6" aria-label="Quick Discussion & Tasks">
      <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Discussion & Tasks</div>
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
          <div className="divide-y" aria-label="Tasks list">
            {tasks.length===0 && (
              <div className="p-4 text-sm text-gray-500">No tasks yet. <button className="underline">+ New task</button></div>
            )}
            {tasks.map(t => (
              <div key={t.id} className="p-3 flex items-start gap-3">
                <input aria-label={`Toggle ${t.title}`} type="checkbox" className="mt-1" checked={t.completed} onChange={()=>toggle(t.id)} />
                <div className="flex-1">
                  <div className={`text-[14.5px] ${t.completed?'line-through text-gray-400':'text-gray-800'}`}>{t.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-[12px] text-gray-500">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-200 text-[10px]">{t.assignee.name.slice(0,2).toUpperCase()}</span>
                    <span>Due {new Date(t.dueDate).toLocaleDateString(undefined,{weekday:'short'})}</span>
                    <span className={`px-2 py-0.5 rounded-full ${priColor(t.priority)}`}>{t.priority}</span>
                  </div>
                </div>
                <button aria-label="More" className="text-gray-400">•••</button>
              </div>
            ))}
            <div className="p-3 text-[12px] text-gray-500"><button className="underline">Show more</button></div>
          </div>
        </div>
      </div>
    </section>
  );
}

