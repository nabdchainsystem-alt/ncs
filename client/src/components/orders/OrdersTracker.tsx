import React from 'react';
import { useOrders } from '../../context/OrdersContext';

const lanes = ['Draft','Pending Approval','Released','Shipped','Delivered','Closed'] as const;

export default function OrdersTracker() {
  const { orders } = useOrders();
  const mapStatus: (s: string) => typeof lanes[number] = (s: string) => {
    const st = s.toLowerCase();
    if (st.includes('progress') || st.includes('open')) return 'Pending Approval';
    if (st.includes('completed')) return 'Closed';
    if (st.includes('canceled')) return 'Draft';
    return 'Released';
  };
  const grouped: Record<typeof lanes[number], number> = { 'Draft':0, 'Pending Approval':0, 'Released':0, 'Shipped':0, 'Delivered':0, 'Closed':0 };
  orders.forEach(o=> { const k = mapStatus(o.status); grouped[k] = (grouped[k]||0)+1; });

  const color = (k:typeof lanes[number]) => k==='Closed' ? '#10B981' : k==='Pending Approval' ? '#F59E0B' : '#3B82F6';

  return (
    <div className="orders-card p-4">
      <div className="font-semibold mb-2">Order Timeline / Tracker</div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {lanes.map((k)=> (
          <div key={k} className="rounded-xl border p-3 bg-white">
            <div className="text-xs text-gray-600 mb-1">{k}</div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full" style={{ width:`${Math.min(100, (grouped[k]||0)/(orders.length||1)*100)}%`, background: color(k) }} />
            </div>
            <div className="text-xs text-gray-500 mt-1">{grouped[k]||0} orders</div>
          </div>
        ))}
      </div>
    </div>
  );
}
