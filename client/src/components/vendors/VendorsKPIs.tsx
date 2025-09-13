import React from 'react';
import { motion } from 'framer-motion';
import { useVendors } from '../../context/VendorsContext';

const VendorsKPIs: React.FC = () => {
  const { vendors, kpis } = useVendors();
  const total = kpis?.total ?? vendors.length;
  const approved = kpis?.approved ?? vendors.filter(v=> String(v.status||'').toLowerCase().includes('approved')).length;
  const pending = kpis?.pending ?? vendors.filter(v=> String(v.status||'').toLowerCase().includes('pending')).length;
  const suspended = vendors.filter(v=> String(v.status||'').toLowerCase().includes('suspend')).length;
  const avgRating = Math.round(((vendors.reduce((s,v)=> s + (v.trustScore||0),0) / Math.max(1, vendors.length)))*10)/10;
  const ontime = kpis?.onTimePct ?? Math.round(vendors.reduce((s,v)=> s + (v.onTimePct||0),0) / Math.max(1, vendors.length));
  const topVendor = (()=>{
    const map = new Map<string, number>();
    vendors.forEach(v=> map.set(v.name, (map.get(v.name)||0) + (v.trustScore||0)));
    return Array.from(map.entries()).sort((a,b)=> b[1]-a[1])[0]?.[0] || '—';
  })();

  const cards = [
    { label:'Total Vendors', value: total },
    { label:'Active Vendors', value: approved },
    { label:'Suspended Vendors', value: suspended },
    { label:'Top Vendor (by Score)', value: topVendor },
    { label:'Avg Vendor Rating', value: avgRating },
    { label:'On‑time Delivery Ratio', value: `${ontime}%` },
  ];

  return (
    <div className="kpi-grid vendors-kpis">
      {cards.map(({ label, value }, i) => (
        <motion.div
          key={label}
          className="rounded-2xl border bg-white shadow-card p-3 transition duration-200 hover:shadow-lg hover:-translate-y-0.5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="kpi-label">{label}</div>
          <div className="kpi-value small">{String(value)}</div>
        </motion.div>
      ))}
    </div>
  );
};

export default VendorsKPIs;
