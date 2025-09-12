import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Lightbulb, LineChart, Sparkles } from 'lucide-react';

const Header: React.FC = () => {
  const { query, setQuery, exportCsv } = useInventory();
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* Left: Title */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Inventory Room</h1>
        <div className="text-xs text-gray-500">Real‑time KPIs, AI forecasts, and actions</div>
      </div>

      {/* Middle: Search (center + wide) */}
      <div className="flex-1 flex justify-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search items by name/code/category..."
          className="border rounded pl-3 pr-3 py-2 text-sm w-[36rem] max-w-[42rem]"
        />
      </div>

      {/* Right: idea buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button data-glow className="px-3 py-2 rounded bg-blue-600 text-white text-sm">+ Add Item</button>
        <button data-glow className="px-3 py-2 rounded bg-gray-700 text-white text-sm" onClick={exportCsv}>Export</button>
        <button className="px-3 py-2 rounded border text-sm inline-flex items-center gap-1" title="Optimization ideas soon">
          <Lightbulb className="w-4 h-4" /> Optimize
        </button>
        <button className="px-3 py-2 rounded border text-sm inline-flex items-center gap-1" title="Reorder plan">
          <LineChart className="w-4 h-4" /> Reorder Plan
        </button>
        <button className="px-3 py-2 rounded border text-sm inline-flex items-center gap-1" title="AI forecast">
          <Sparkles className="w-4 h-4" /> Forecast
        </button>
      </div>
    </header>
  );
};

export default Header;
