import React from 'react';

const items = Array.from({ length: 24 }).map((_, i) => ({
  id: i + 1,
  title: `Industrial Item ${i + 1}`,
  vendor: ['Alpha','Beta','Gamma','Delta'][i % 4],
  price: (100 + i * 7).toFixed(2),
}));

export default function Marketplace() {
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">B2B Marketplace</h1>
        <div className="flex items-center gap-2">
          <input placeholder="Search items…" className="border rounded px-3 py-2 text-sm w-64" />
          <select className="border rounded px-3 py-2 text-sm">
            <option>All Vendors</option>
            <option>Alpha</option>
            <option>Beta</option>
            <option>Gamma</option>
            <option>Delta</option>
          </select>
        </div>
      </header>

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

