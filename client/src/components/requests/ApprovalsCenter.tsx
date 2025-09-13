import React from 'react';

type Row = { reqId?: string | number; requestNo: string; requester?: string; department?: string; quantity?: number; status: 'NEW'|'RFQ'|'APPROVED'|'COMPLETED' };

export default function ApprovalsCenter({ rows, onApprove }: { rows: Row[]; onApprove?: (id: string|number|undefined)=>void }) {
  const pending = React.useMemo(() => {
    const m = new Map<string, Row>();
    rows.filter(r => r.status === 'NEW').forEach(r => m.set(r.requestNo, r));
    return Array.from(m.values());
  }, [rows]);

  const [sel, setSel] = React.useState<Record<string, boolean>>({});
  const allChecked = pending.length>0 && pending.every(r => sel[r.requestNo]);
  const toggleAll = () => {
    if (allChecked) setSel({}); else {
      const next: Record<string, boolean> = {}; pending.forEach(r => next[r.requestNo] = true); setSel(next);
    }
  };

  const bulkApprove = async () => {
    for (const r of pending) if (sel[r.requestNo]) await onApprove?.(r.reqId);
    setSel({});
  };

  return (
    <div className="card card-p">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold">Approvals Center</div>
        <button className="px-3 py-1.5 text-sm rounded border hover:bg-gray-50" disabled={!Object.values(sel).some(Boolean)} onClick={bulkApprove}>Bulk Approve</button>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left"><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
              <th className="px-3 py-2 text-left">Request No</th>
              <th className="px-3 py-2 text-left">Requester</th>
              <th className="px-3 py-2 text-left">Dept</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.length===0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={7}>No approvals pending</td></tr>
            ) : pending.map(r => (
              <tr key={r.requestNo} className="border-b last:border-0">
                <td className="px-3 py-2"><input type="checkbox" checked={!!sel[r.requestNo]} onChange={(e)=> setSel(s => ({ ...s, [r.requestNo]: e.currentTarget.checked }))} /></td>
                <td className="px-3 py-2">{r.requestNo}</td>
                <td className="px-3 py-2">{r.requester || '—'}</td>
                <td className="px-3 py-2">{r.department || '—'}</td>
                <td className="px-3 py-2 text-right">{r.quantity ?? '—'}</td>
                <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">Pending</span></td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=> onApprove?.(r.reqId)}>Approve</button>
                    <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" title="Local-only" onClick={()=> alert('Reject: not enabled on backend yet')}>Reject</button>
                    <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50" onClick={()=> alert('View details coming soon')}>View</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

