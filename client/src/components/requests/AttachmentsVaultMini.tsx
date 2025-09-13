import React from 'react';
import '../../styles/archive.css';

type Req = { requestNo: string; vendor?: string; department?: string };

const folders = [
  { key: 'tech', label: 'Technical Specs' },
  { key: 'quotes', label: 'Quotations' },
  { key: 'approvals', label: 'Approvals' },
  { key: 'orders', label: 'Related Orders' },
] as const;

export default function AttachmentsVaultMini({ requests }: { requests: Req[] }) {
  const [q, setQ] = React.useState('');
  const filtered = React.useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return requests;
    return requests.filter(r => [r.requestNo, r.vendor, r.department].filter(Boolean).some(v => String(v).toLowerCase().includes(s)));
  }, [q, requests]);

  const [open, setOpen] = React.useState<Req | null>(null);

  function buildPreviewRows(r: Req) {
    const key = r.requestNo || '';
    let seed = 0; for (let i=0;i<key.length;i++) seed = (seed*31 + key.charCodeAt(i)) >>> 0;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 0xffffffff;
    const cats = ['Technical Specs','Quotations','Approvals','Related Orders'];
    const rows: Array<{ name: string; category: string; version: string; updated: string; size: string }> = [];
    const n = 6 + Math.floor(rnd()*6);
    for (let i=0;i<n;i++) {
      const c = cats[Math.floor(rnd()*cats.length)];
      rows.push({
        name: `${c.replace(/\s/g,'_').toLowerCase()}_${i+1}.pdf`,
        category: c,
        version: `v${1+Math.floor(rnd()*4)}.${Math.floor(rnd()*10)}`,
        updated: new Date(Date.now() - Math.floor(rnd()*45)*86400000).toISOString().slice(0,10),
        size: `${(100 + Math.floor(rnd()*900))} KB`,
      });
    }
    return rows;
  }

  return (
    <div className="arch-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-bold">Attachments Vault</div>
        <div className="arch-hero">
          <input className="h-8 w-64 rounded-lg border px-3 text-sm" value={q} onChange={(e)=> setQ(e.currentTarget.value)} placeholder="Search in attachments (OCR-ready)" />
          <button className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Open Vault</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {filtered.slice(0,8).map((r) => (
          <button key={r.requestNo} className="arch-card p-4 text-center hover:shadow-lg-soft transition-shadow" onClick={()=> setOpen(r)}>
            <div className="grid place-items-center">
              <div className="folder-3d" style={{ width: 180, height: 130 }}>
                <div className="tab" />
                <div className="body" />
                <div className="glow" />
              </div>
            </div>
            <div className="mt-2 font-semibold text-sm">{r.requestNo}</div>
            <div className="text-xs text-gray-500">{r.vendor || '—'} · {r.department || '—'}</div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
              {folders.map(f => (
                <span key={f.key} className="text-[10px] px-1.5 py-0.5 rounded-full border bg-white text-gray-600">{f.label}</span>
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-gray-500">OCR note: scanned PDFs become searchable once processed.</div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={()=> setOpen(null)}>
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border animate-slide-up" onClick={(e)=> e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <div className="text-lg font-semibold">{open.requestNo}</div>
                <div className="text-xs text-gray-500">{open.vendor || '—'} · {open.department || '—'}</div>
              </div>
              <button className="px-2 py-1 text-sm rounded border hover:bg-gray-50" onClick={()=> setOpen(null)}>Close</button>
            </div>
            <div className="p-4">
              <div className="text-sm font-semibold mb-2">Files</div>
              <div className="overflow-auto">
                <table className="u-table text-sm" style={{ borderSpacing: 0 }}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Version</th>
                      <th>Updated</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildPreviewRows(open).map((row, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.category}</td>
                        <td className="px-3 py-2">{row.version}</td>
                        <td className="px-3 py-2">{row.updated}</td>
                        <td className="px-3 py-2">{row.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
