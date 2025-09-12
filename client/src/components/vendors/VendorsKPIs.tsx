import React from 'react';

const VendorsKPIs: React.FC = () => {
  const kpis = [
    { label: 'Total Vendors', value: 145 },
    { label: 'Approved', value: 95, trend: '+5%' },
    { label: 'Pending', value: 30, trend: '-2%' },
    { label: 'On-Hold', value: 20 },
    { label: 'On-Time Delivery %', value: '92%' },
    { label: 'Complaints (30d)', value: 7 },
    { label: 'Avg Trust Score', value: '82/100' },
    { label: 'Avg Quote Response', value: '36 hrs' },
  ].slice(0,4);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <button className="px-3 py-2 rounded border text-sm hover:bg-gray-50" title="Customize cards">Customize</button>
      </div>
      <div className="kpi-grid">
        {kpis.map(({ label, value, trend }) => (
          <div key={label} className="kpi-card" style={{ minHeight: 92 }}>
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
            {trend && <div className="kpi-trend" style={{ color: trend.startsWith('+') ? '#16A34A' : '#DC2626' }}>{trend}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorsKPIs;
