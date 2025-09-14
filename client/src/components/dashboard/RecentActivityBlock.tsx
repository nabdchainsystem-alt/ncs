import React from 'react';

type Activity = {
  id: string;
  actorName: string;
  actorAvatarUrl?: string;
  action: string;
  target: string;
  category: 'Requests' | 'Orders' | 'Inventory' | 'Vendors';
  amountSar?: number;
  timestampISO: string;
};

export default function RecentActivityBlock() {
  const activities: Activity[] = [
    { id: 'a1', actorName: 'Maya', action: 'approved', target: 'Order #PO-2049', category: 'Orders', amountSar: 45000, timestampISO: new Date(Date.now()-3600e3).toISOString() },
    { id: 'a2', actorName: 'Omar', action: 'created', target: 'Request #RQ-1182', category: 'Requests', timestampISO: new Date(Date.now()-7200e3).toISOString() },
    { id: 'a3', actorName: 'Lina', action: 'received', target: 'Inbound WH‑A (24 pallets)', category: 'Inventory', timestampISO: new Date(Date.now()-26*3600e3).toISOString() },
  ];

  const catColor: Record<Activity['category'], string> = {
    Requests: 'bg-sky-100 text-sky-700',
    Orders: 'bg-indigo-100 text-indigo-700',
    Inventory: 'bg-emerald-100 text-emerald-700',
    Vendors: 'bg-purple-100 text-purple-700',
  };

  return (
    <section className="rounded-2xl border bg-white dark:bg-gray-900 shadow-card p-6" aria-label="Recent Activity">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[16px] font-semibold text-gray-900 dark:text-gray-100">Recent Activity</div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          {['All','Requests','Orders','Inventory','Vendors'].map(f => <span key={f} className="px-2 py-0.5 rounded-full border">{f}</span>)}
        </div>
      </div>
      {activities.length===0 ? (
        <div className="text-sm text-gray-500">No recent activity.</div>
      ) : (
        <ol className="relative ml-3">
          {activities.map((a) => (
            <li key={a.id} className="pl-6 pb-5 border-l last:border-0">
              <span className="absolute -left-2 top-1 w-3 h-3 rounded-full bg-gray-300"></span>
              <div className="text-[14.5px] text-gray-800">
                <strong>{a.actorName}</strong> {a.action} <span className="text-gray-500 hover:underline cursor-pointer">{a.target}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[12px] text-gray-500">
                <span>{new Date(a.timestampISO).toLocaleString()}</span>
                <span className={`px-2 py-0.5 rounded-full ${catColor[a.category]}`}>{a.category}</span>
                {typeof a.amountSar==='number' && (
                  <span className="ml-auto text-[12px] font-semibold text-gray-800 bg-gray-100 px-2 py-0.5 rounded-full">+ {a.amountSar.toLocaleString()} SAR</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

