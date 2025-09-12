import React from 'react';

const WHCard: React.FC<{ title: string; available: number; shortages: number }> = ({ title, available, shortages }) => {
  return (
    <div className="inv-card p-4">
      <div className="font-semibold mb-1">{title}</div>
      <div className="text-xs text-gray-500 mb-3">Overview</div>
      <div className="h-20 w-full bg-gray-50 rounded relative overflow-hidden">
        <div className="absolute inset-0 flex items-end gap-2 px-2">
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 10 + ((i * 29) % 70);
            return <div key={i} className="flex-1 bg-emerald-400/70" style={{ height: `${h}%` }} />;
          })}
        </div>
      </div>
      <div className="flex gap-2 mt-3 text-sm">
        <span className="inv-badge ok">Available {available}</span>
        <span className="inv-badge low">Shortages {shortages}</span>
      </div>
    </div>
  );
};

const Warehouses: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <WHCard title="Riyadh Warehouse" available={820} shortages={12} />
      <WHCard title="Dammam Warehouse" available={640} shortages={9} />
      <WHCard title="Jeddah Warehouse" available={710} shortages={15} />
    </div>
  );
};

export default Warehouses;

