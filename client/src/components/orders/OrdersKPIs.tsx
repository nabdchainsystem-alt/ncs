import React from 'react';
import { motion } from 'framer-motion';
import { useOrders } from '../../context/OrdersContext';
import '../../styles/orders.css';

const OrdersKPIs: React.FC = () => {
  const { kpis } = useOrders();
  const cards = [
    { label:'Total Orders', v:kpis.total },
    { label:'Open', v:kpis.open },
    { label:'In Progress', v:kpis.progress },
    { label:'Completed', v:kpis.completed },
    { label:'Canceled', v:kpis.canceled },
    { label:'Avg Lead Time', v:kpis.avgLead, unit:'days' },
    { label:'On-Time Delivery', v:kpis.otd, unit:'%' },
    { label:'Orders Value', v:kpis.value.toLocaleString(), unit:'SAR' },
    { label:'Overdue', v:kpis.overdue },
  ].slice(0,4);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-end">
        <button className="px-3 py-2 rounded border text-sm hover:bg-gray-50" title="Customize cards">Customize</button>
      </div>
      <div className="orders-kpi">
      {cards.map((c,i)=> (
        <motion.div key={i} className="item" style={{ minHeight: 92 }} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}>
          <div className="label">{c.label}</div>
          <div className="value">{c.v} {c.unit ? <span className="text-gray-500 text-sm font-semibold">{c.unit}</span>:null}</div>
        </motion.div>
      ))}
      </div>
    </div>
  );
};

export default OrdersKPIs;
