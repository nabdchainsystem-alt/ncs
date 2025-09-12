import React from 'react';
import { useOrders } from '../../context/OrdersContext';

const OrdersHeader: React.FC = () => {
  const { query, setQuery, toggleHologram } = useOrders() as any;
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Orders Room</h1>
        <div className="text-xs text-gray-500">Operate faster than SAP / Oracle 🚀</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input value={query} onChange={(e)=> setQuery(e.target.value)} placeholder="Search order, vendor, incoterms..." className="border rounded pl-3 pr-3 py-2 text-sm w-72" />
        <button data-glow className="px-3 py-2 rounded bg-blue-600 text-white text-sm">+ Add Order</button>
        <button data-glow className="px-3 py-2 rounded bg-gray-700 text-white text-sm">Import</button>
        <button data-glow className="px-3 py-2 rounded bg-gray-700 text-white text-sm">Export</button>
        <button data-glow className="px-3 py-2 rounded bg-indigo-600 text-white text-sm" onClick={toggleHologram}>Hologram Mode</button>
      </div>
    </header>
  );
};

export default OrdersHeader;
