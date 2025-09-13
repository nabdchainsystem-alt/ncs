import React from 'react';

type Line = { requestNo: string; materialCode?: string; description?: string; quantity?: number; department?: string; vendor?: string; status: 'NEW'|'RFQ'|'APPROVED'|'COMPLETED' };

export default function AISuggestions({ lines }: { lines: Line[] }) {
  const pending = React.useMemo(() => lines.filter(l => l.status === 'NEW'), [lines]);

  // Auto priority suggestion
  const priorityOf = (l: Line) => {
    const qty = Number(l.quantity || 0);
    if (['Maintenance','Operations'].includes(String(l.department))) return 'High';
    if (qty >= 100) return 'High';
    if (qty >= 20) return 'Medium';
    return 'Low';
  };

  // Vendor suggestions by historical frequency per materialCode
  const vendorByMaterial = React.useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    for (const l of lines) {
      const code = (l.materialCode || '').trim();
      const v = (l.vendor || '').trim();
      if (!code || !v) continue;
      if (!map.has(code)) map.set(code, new Map());
      const inner = map.get(code)!; inner.set(v, (inner.get(v) || 0) + 1);
    }
    const best = new Map<string, string>();
    for (const [code, counts] of map) {
      let b = '', n = 0; for (const [v, c] of counts) if (c > n) { b=v; n=c; }
      best.set(code, b);
    }
    return best;
  }, [lines]);

  // Smart alerts: repeated requests for same code/desc
  const duplicates = React.useMemo(() => {
    const m = new Map<string, number>();
    lines.forEach(l => { const k = (l.materialCode || l.description || '').trim().toLowerCase(); if (k) m.set(k, (m.get(k)||0)+1); });
    return Array.from(m.entries()).filter(([,v]) => v >= 2).map(([k,v]) => ({ key:k, times:v }));
  }, [lines]);

  return (
    <div className="card card-p">
      <div className="mb-3 text-sm font-semibold">Automation & AI Suggestions</div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Auto-priority */}
        <div className="rounded-xl border bg-white p-3">
          <div className="text-sm font-semibold mb-2">Auto-priority</div>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {pending.slice(0,6).map((l,i)=> (
              <li key={i}><b>{l.requestNo}</b> · {l.materialCode || l.description || '—'} → <span className="text-gray-700">{priorityOf(l)}</span></li>
            ))}
            {pending.length===0 && <li className="text-gray-500">No pending items</li>}
          </ul>
        </div>
        {/* Vendor suggestions */}
        <div className="rounded-xl border bg-white p-3">
          <div className="text-sm font-semibold mb-2">Vendor suggestions</div>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {pending.slice(0,6).map((l,i)=> {
              const v = vendorByMaterial.get((l.materialCode||'').trim());
              return <li key={i}><b>{l.materialCode || l.description || '—'}</b> → {v || '—'}</li>;
            })}
          </ul>
        </div>
        {/* Smart alerts */}
        <div className="rounded-xl border bg-white p-3">
          <div className="text-sm font-semibold mb-2">Smart Alerts</div>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {duplicates.slice(0,6).map(d => (
              <li key={d.key}><b>{d.key}</b> requested {d.times} times</li>
            ))}
            {duplicates.length===0 && <li className="text-gray-500">No duplicates detected</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

