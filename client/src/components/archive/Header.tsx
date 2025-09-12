import React from 'react';
import { useArchive } from '../../context/ArchiveContext';
import '../../styles/archive.css';

const Header: React.FC = () => {
  const { query, setQuery, filter, setFilter } = useArchive();
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Archive Room</h1>
        <div className="text-xs text-gray-500">Company’s golden library — fast search & rich preview</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e)=> setQuery(e.target.value)}
          placeholder="Search documents, vendors, types…"
          className="border rounded pl-3 pr-3 py-2 text-sm w-72"
        />
        <select className="border rounded px-3 py-2 text-sm" value={filter.type||''} onChange={(e)=> setFilter({ type: e.target.value || undefined })}>
          <option value="">All Types</option>
          <option value="pdf">PDF</option>
          <option value="image">Image</option>
          <option value="doc">Doc</option>
          <option value="xls">XLS</option>
          <option value="link">Link</option>
        </select>
        <input type="date" className="border rounded px-3 py-2 text-sm" value={filter.from||''} onChange={(e)=> setFilter({ from: e.target.value||null })} />
        <input type="date" className="border rounded px-3 py-2 text-sm" value={filter.to||''} onChange={(e)=> setFilter({ to: e.target.value||null })} />
      </div>
    </header>
  );
};

export default Header;

