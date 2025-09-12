import React from 'react';
import { motion } from 'framer-motion';
import { useReports } from '../../context/ReportsContext';
import '../../styles/reports.css';

const KPIs: React.FC = () => {
  const { kpis } = useReports();
  const items = [
    { label:'Total Spend', v:kpis.spend.toLocaleString(), unit:'SAR' },
    { label:'Savings Achieved', v:kpis.savings, unit:'%' },
    { label:'Average Lead Time', v:kpis.lead, unit:'days' },
    { label:'On-Time Delivery', v:kpis.otd, unit:'%' },
    { label:'Supplier Trust Index', v:kpis.trust, unit:'/100' },
    { label:'Inventory Coverage', v:kpis.coverage, unit:'days' },
  ].slice(0,4);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <button className="px-3 py-2 rounded border text-sm hover:bg-gray-50" title="Customize cards">Customize</button>
      </div>
      <div className="rep-kpi">
      {items.map((c,i)=> (
        <motion.div key={i} className="item" style={{ minHeight: 92 }} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
          <div className="label">{c.label}</div>
          <div className="value">{c.v} {c.unit ? <span className="text-gray-500 text-sm font-semibold">{c.unit}</span>:null}</div>
        </motion.div>
      ))}
      </div>
    </div>
  );
};

export default KPIs;
