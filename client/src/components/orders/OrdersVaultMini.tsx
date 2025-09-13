import React from 'react';
import '../../styles/archive.css';
import { useOrders } from '../../context/OrdersContext';

const folders = ['PO PDF','Contracts','Quotations','Delivery Notes','Invoices','Payment Proofs'] as const;

function buildRows(key: string) {
  let seed = 0; for (let i=0;i<key.length;i++) seed = (seed*31 + key.charCodeAt(i)) >>> 0;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 0xffffffff;
  const rows: Array<{ name:string; type:string; updated:string; size:string }> = [];
  const n = 5 + Math.floor(rnd()*4);
  for (let i=0;i<n;i++) {
    const type = folders[Math.floor(rnd()*folders.length)];
    rows.push({ name: `${type.replace(/\s/g,'_').toLowerCase()}_${i+1}.pdf`, type, updated: new Date(Date.now()-Math.floor(rnd()*40)*86400000).toISOString().slice(0,10), size: `${(120+Math.floor(rnd()*800))} KB` });
  }
  return rows;
}

export default function OrdersVaultMini() {
  const { orders } = useOrders();
  const [open, setOpen] = React.useState<any|null>(null);
  return (
    <div className="arch-card p-4">
      <div className="text-sm font-bold mb-3">Orders Attachments Vault</div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
        {orders.slice(0,4).map((o)=> (
          <button key={o.id} className="arch-card p-4 text-center hover:shadow-lg-soft" onClick={()=> setOpen(o)}>
            <div className="grid place-items-center">
              <div className="folder-3d" style={{ width: 200, height: 140 }}>
                <div className="tab" />
                <div className="body" />
                <div className="glow" />
              </div>
            </div>
            <div className="mt-2 font-semibold text-sm">{o.orderNo}</div>
            <div className="text-xs text-gray-500">{o.vendor}</div>
          </button>
        ))}
      </div>
      {open && (
        <div className="fixed inset-0 z-[9999] bg-black/40 grid place-items-center p-4" onClick={()=> setOpen(null)}>
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border animate-slide-up" onClick={(e)=> e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="font-semibold">{open.orderNo} — {open.vendor}</div>
              <button className="px-2 py-1 text-sm rounded border" onClick={()=> setOpen(null)}>Close</button>
            </div>
            <div className="p-3 table-wrap overflow-auto">
              <table className="u-table text-sm">
                <thead><tr><th>Name</th><th>Type</th><th>Updated</th><th>Size</th></tr></thead>
                <tbody>
                  {buildRows(open.orderNo).map((r,i)=> (
                    <tr key={i}><td>{r.name}</td><td>{r.type}</td><td>{r.updated}</td><td>{r.size}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
