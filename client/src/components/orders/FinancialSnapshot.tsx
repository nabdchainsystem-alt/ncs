import React from 'react';
import { useOrders } from '../../context/OrdersContext';
import PaymentBar from './PaymentBar';

export default function FinancialSnapshot({ className = '' }: { className?: string }) {
  const { orders } = useOrders();
  const [page, setPage] = React.useState(1);
  const pageSize = 5;
  const paidPct = (o:any)=> Math.round(o.payment.reduce((s:number,p:any)=> s + (p.paid ? p.pct : 0), 0));
  const paid = orders.filter(o=> paidPct(o)>=100).length;
  const pending = orders.filter(o=> paidPct(o)>0 && paidPct(o)<100).length;
  const overdue = orders.filter(o=> new Date(o.deliveryDate).getTime() < Date.now() && o.status !== 'Completed').length;

  const totalPages = Math.max(1, Math.ceil(orders.length / pageSize));
  const pageSafe = Math.min(page, totalPages);
  const slice = orders.slice((pageSafe-1)*pageSize, (pageSafe-1)*pageSize + pageSize);

  return (
    <div className={`orders-card p-4 ${className}`}
      style={{ minHeight: 560 }}
    >
      <div className="font-semibold mb-2">Financial Snapshot</div>
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="rounded-xl border p-2 bg-white"><div className="text-xs text-gray-500">Paid</div><div className="text-xl font-semibold text-emerald-600">{paid}</div></div>
        <div className="rounded-xl border p-2 bg-white"><div className="text-xs text-gray-500">Pending</div><div className="text-xl font-semibold text-amber-600">{pending}</div></div>
        <div className="rounded-xl border p-2 bg-white"><div className="text-xs text-gray-500">Overdue</div><div className="text-xl font-semibold text-red-600">{overdue}</div></div>
      </div>
      <div className="space-y-2">
        {slice.map((o)=> (
          <div key={o.id} className="rounded-xl border p-2 bg-white">
            <div className="text-sm font-medium">{o.orderNo} — {o.vendor}</div>
            <div className="mt-1"><PaymentBar stages={o.payment} /></div>
            <div className="text-xs text-gray-500 mt-1">Paid {paidPct(o)}%</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <button className="px-3 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-50" disabled={pageSafe<=1} onClick={()=> setPage((p)=> Math.max(1, p-1))}>Previous</button>
        <div className="text-xs text-gray-600">Page {pageSafe} / {totalPages}</div>
        <button className="px-3 py-1.5 rounded border hover:bg-gray-50 disabled:opacity-50" disabled={pageSafe>=totalPages} onClick={()=> setPage((p)=> Math.min(totalPages, p+1))}>Next</button>
      </div>
    </div>
  );
}
