import React from 'react';

export default function InventoryMiniChat() {
  const [active, setActive] = React.useState<string>('');
  const [txt, setTxt] = React.useState('');
  const [msgs, setMsgs] = React.useState<Record<string, { id: string; at: string; user: string; text: string }[]>>({});

  const send = () => {
    const t = txt.trim();
    if (!active || !t) return;
    const id = (globalThis.crypto as any)?.randomUUID ? (globalThis.crypto as any).randomUUID() : String(Math.random());
    const m = { id, at: new Date().toISOString(), user: 'you', text: t };
    setMsgs((s) => ({ ...s, [active]: [ ...(s[active] || []), m ] }));
    setTxt('');
  };

  return (
    <div className="u-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">Mini Discussion</div>
        <input value={active} onChange={(e)=> setActive(e.currentTarget.value)} className="h-9 rounded-xl border px-3 text-sm" placeholder="Active Item Code (e.g., BRG-6204)" />
      </div>
      <div className="h-48 overflow-auto space-y-2 rounded-xl border bg-white p-2">
        {(msgs[active] || []).map(m => (
          <div key={m.id} className="rounded-lg border p-2 bg-gray-50">
            <div className="text-xs text-gray-500">{m.user} • {new Date(m.at).toLocaleString()}</div>
            <div className="text-sm">{m.text}</div>
          </div>
        ))}
        {(msgs[active] || []).length === 0 && (
          <div className="text-sm text-gray-500">Start a discussion for this item…</div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input value={txt} onChange={(e)=> setTxt(e.currentTarget.value)} className="flex-1 h-9 rounded-xl border px-3 text-sm" placeholder="Write a message…" />
        <button className="px-3 py-2 rounded border text-sm hover:bg-gray-50" onClick={send}>Send</button>
      </div>
    </div>
  );
}

