import React from 'react';
import '../../styles/inventory.css';
import { useInventory } from '../../context/InventoryContext';

const Filters: React.FC = () => {
  const { filters, setFilters } = useInventory();
  return (
    <div className="inv-filter-panel">
      <div className="title">Filters</div>
      <div className="grid gap-3 text-sm">
        <label className="grid gap-1">
          <span className="text-gray-600">Warehouse</span>
          <select className="border rounded px-2 py-2" value={filters.warehouse || ''} onChange={(e)=> setFilters({ warehouse: e.target.value || undefined })}>
            <option value="">All</option>
            <option>Riyadh</option>
            <option>Dammam</option>
            <option>Jeddah</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-gray-600">Category</span>
          <select className="border rounded px-2 py-2" value={filters.category || ''} onChange={(e)=> setFilters({ category: e.target.value || undefined })}>
            <option value="">All</option>
            <option>Spare Parts</option>
            <option>Safety</option>
            <option>Consumables</option>
            <option>Equipment</option>
            <option>Chemicals</option>
            <option>Electronics</option>
          </select>
        </label>
        <button className="px-3 py-2 border rounded" onClick={()=> setFilters({ warehouse: undefined, category: undefined })}>Clear</button>
      </div>
    </div>
  );
};

export default Filters;

