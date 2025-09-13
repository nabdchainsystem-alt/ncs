import React from 'react';

export type ReqLite = {
  reqId?: string | number;
  requestNo: string;
  vendor?: string;
  department?: string;
  status: 'NEW' | 'RFQ' | 'APPROVED' | 'COMPLETED';
  date?: string; // ISO or display
  lines?: number;
};

export default function RequestTracker({
  requests,
  onChangeStatus,
}: {
  requests: ReqLite[];
  onChangeStatus?: (reqId: string | number | undefined, next: 'RFQ' | 'APPROVED' | 'COMPLETED') => void;
}) {
  const [view, setView] = React.useState<'kanban' | 'timeline'>('kanban');

  const uniqueByReq = React.useMemo(() => {
    const m = new Map<string, ReqLite & { lines: number }>();
    for (const r of requests) {
      const k = r.requestNo || String(r.reqId || '—');
      const prev = m.get(k);
      m.set(k, { ...r, lines: (prev?.lines || 0) + (r.lines || 1) });
    }
    return Array.from(m.values());
  }, [requests]);

  const cols = [
    { key: 'NEW', label: 'New' },
    { key: 'REVIEW', label: 'Under Review' },
    { key: 'RFQ', label: 'Quotation' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'CONVERTED', label: 'Converted to Order' },
    { key: 'COMPLETED', label: 'Closed' },
  ] as const;

  const stageOf = (s: ReqLite['status']): number => {
    if (s === 'NEW') return 1; // New/Under Review
    if (s === 'RFQ') return 3; // Quotation
    if (s === 'APPROVED') return 4; // Approved/Converted
    if (s === 'COMPLETED') return 6; // Closed
    return 1;
  };
  const colorFor = (s: string) => (
    s === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    s === 'APPROVED' ? 'bg-sky-50 text-sky-700 border-sky-200' :
    s === 'RFQ' ? 'bg-amber-50 text-amber-700 border-amber-200' :
    'bg-gray-50 text-gray-700 border-gray-200'
  );

  const grouped = React.useMemo(() => {
    const g: Record<string, ReqLite[]> = { NEW: [], REVIEW: [], RFQ: [], APPROVED: [], CONVERTED: [], COMPLETED: [] };
    uniqueByReq.forEach((r) => {
      if (r.status === 'NEW') g.NEW.push(r);
      else if (r.status === 'RFQ') g.RFQ.push(r);
      else if (r.status === 'APPROVED') g.APPROVED.push(r);
      else if (r.status === 'COMPLETED') g.COMPLETED.push(r);
    });
    return g;
  }, [uniqueByReq]);

  const nextStatus = (s: ReqLite['status']): 'RFQ' | 'APPROVED' | 'COMPLETED' | null => {
    if (s === 'NEW') return 'RFQ';
    if (s === 'RFQ') return 'APPROVED';
    if (s === 'APPROVED') return 'COMPLETED';
    return null;
  };

  return (
    <div className="card card-p">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Request Tracker (Lifecycle)</div>
        <div className="flex items-center gap-2">
          <button className={`px-2 py-1 text-xs rounded border ${view==='kanban'?'bg-gray-900 text-white border-gray-900':'hover:bg-gray-50'}`} onClick={()=> setView('kanban')}>Kanban</button>
          <button className={`px-2 py-1 text-xs rounded border ${view==='timeline'?'bg-gray-900 text-white border-gray-900':'hover:bg-gray-50'}`} onClick={()=> setView('timeline')}>Timeline</button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {cols.map((c) => (
            <div key={c.key as string} className="rounded-xl border bg-white">
              <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b rounded-t-xl">{c.label}</div>
              <div className="p-2 space-y-2 max-h-[420px] overflow-auto scroll-smooth">
                {(grouped as any)[c.key]?.map((r: ReqLite, i: number) => (
                  <div key={(r.reqId || r.requestNo) + '_' + i} className="rounded-lg border bg-white p-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{r.requestNo}</div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${colorFor(r.status)}`}>{r.status}</span>
                    </div>
                    <div className="text-xs text-gray-500">{r.vendor || '—'} · {r.department || '—'}</div>
                    <div className="mt-1 text-[11px] text-gray-500">Lines: {r.lines || 1} · {r.date || '—'}</div>
                    {onChangeStatus && nextStatus(r.status) && (
                      <div className="mt-2 flex justify-end">
                        <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={() => onChangeStatus(r.reqId as any, nextStatus(r.status)!)}>Move → {nextStatus(r.status)}</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {uniqueByReq.map((r) => {
            const stage = stageOf(r.status);
            return (
              <div key={(r.reqId || r.requestNo) as any} className="rounded-lg border bg-white p-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">{r.requestNo}</div>
                  <div className="text-xs text-gray-500">{r.vendor || '—'} · {r.department || '—'} · {r.date || '—'}</div>
                </div>
                <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500" style={{ width: `${(stage/6)*100}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                  {['New','Review','RFQ','Approved','Converted','Closed'].map((lab, i) => (
                    <span key={lab} className={i+1<=stage? 'text-gray-800':''}>{lab}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

