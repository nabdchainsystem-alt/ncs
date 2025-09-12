import React from 'react';
import '../../styles/inventory.css';

const Alerts: React.FC = () => {
  const critical = [
    { name: 'Hydraulic Hose 1"', code: 'HOS-1', qty: 0 },
    { name: 'Motor 2.2kW', code: 'MTR-22', qty: 6 },
  ];
  const expiry = [
    { name: 'Air Filter A12', code: 'FLT-A12', date: '2025-12-10' },
    { name: 'Gloves Nitrile', code: 'GLV-N', date: '2025-04-01' },
  ];
  const dependency = [
    { name: 'Conveyor Belt B-88', code: 'BLT-B88', risk: 'Single' },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="inv-card p-4">
        <div className="font-semibold mb-2">Critical Stock</div>
        <ul className="text-sm">
          {critical.map((x,i)=>(
            <li key={i} className="flex items-center justify-between border-b py-1 last:border-b-0">
              <span>{x.name} <span className="text-gray-500">({x.code})</span></span>
              <span className="inv-badge out">{x.qty===0?'Out':'Low'}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="inv-card p-4">
        <div className="font-semibold mb-2">Expiry Alerts</div>
        <ul className="text-sm">
          {expiry.map((x,i)=>(
            <li key={i} className="flex items-center justify-between border-b py-1 last:border-b-0">
              <span>{x.name} <span className="text-gray-500">({x.code})</span></span>
              <span className="inv-badge low">{x.date}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="inv-card p-4">
        <div className="font-semibold mb-2">Supplier Dependency</div>
        <ul className="text-sm">
          {dependency.map((x,i)=>(
            <li key={i} className="flex items-center justify-between border-b py-1 last:border-b-0">
              <span>{x.name} <span className="text-gray-500">({x.code})</span></span>
              <span className="inv-chip"><span className="dot" style={{ background:'#F59E0B' }}/>{x.risk}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Alerts;

