import React from 'react';
import HeaderBar from '../components/ui/HeaderBar';
import { Download } from 'lucide-react';

const items = Array.from({ length: 24 }).map((_, i) => ({
  id: i + 1,
  title: `Industrial Item ${i + 1}`,
  vendor: ['Alpha','Beta','Gamma','Delta'][i % 4],
  price: (100 + i * 7).toFixed(2),
}));

export default function Marketplace() {
  return (
    <div className="p-6 space-y-6">
      <HeaderBar title="B2B Marketplace" onSearch={()=>{}} actions={[{ key:'export', label:'Export', icon:<Download className='w-4 h-4' /> }]} />

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((it) => (
          <div key={it.id} className="bg-white rounded-lg shadow p-4 flex flex-col">
            <div className="h-28 rounded bg-gray-100 mb-3 flex items-center justify-center text-gray-400">Image</div>
            <div className="font-semibold">{it.title}</div>
            <div className="text-sm text-gray-500">by {it.vendor}</div>
            <div className="mt-auto flex items-center justify-between pt-3">
              <div className="font-semibold">${it.price}</div>
              <button className="px-3 py-1.5 text-sm rounded bg-gray-900 text-white">RFQ</button>
            </div>
          </div>
        ))}
      </section>

      <footer className="text-center text-xs text-gray-500 py-8">Scroll to explore more items…</footer>
    </div>
  );
}
