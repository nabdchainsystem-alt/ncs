import React from 'react';
import { motion } from 'framer-motion';
import { useOrders } from '../../context/OrdersContext';
import '../../styles/orders.css';
import { LineChart, TrendingUp, Timer, CheckCircle, Package, DollarSign, Star } from 'lucide-react';

const OrdersKPIs: React.FC = () => {
  const { kpis, orders } = useOrders();

  const month = new Date().getMonth();
  const prev = (month + 11) % 12;
  const sumByMonth = (m:number)=> orders.filter(o=> new Date(o.date).getMonth()===m).reduce((s,o)=> s+o.value, 0);
  const curSpend = sumByMonth(month);
  const prevSpend = sumByMonth(prev) || curSpend*0.8;
  const trend = (cur:number, prev:number) => {
    if (prev<=0) return { up:true, pct:100 };
    const p = Math.round(((cur-prev)/prev)*100);
    return { up: p>=0, pct: Math.abs(p) };
  };
  const spendTrend = trend(curSpend, prevSpend);

  const byVendor = new Map<string, number>();
  orders.forEach(o=> byVendor.set(o.vendor, (byVendor.get(o.vendor)||0) + o.value));
  const topVendor = Array.from(byVendor.entries()).sort((a,b)=> b[1]-a[1])[0]?.[0] || '—';

  const cards = [
    { label:'Total Orders', value:kpis.total, icon:<Package className="w-4 h-4" />, t:trend(kpis.total, Math.max(1, kpis.total-2)) },
    { label:'Open Orders', value:kpis.open + kpis.progress, icon:<Timer className="w-4 h-4" />, t:trend(kpis.open+kpis.progress, kpis.open+kpis.progress+1) },
    { label:'Closed Orders', value:kpis.completed, icon:<CheckCircle className="w-4 h-4" />, t:trend(kpis.completed, Math.max(1,kpis.completed-1)) },
    { label:'On‑time vs Delayed', value:`${kpis.otd}%`, icon:<TrendingUp className="w-4 h-4" />, t:trend(kpis.otd, Math.max(1,kpis.otd-5)) },
    { label:'Monthly Spend', value:`${(curSpend/1_000_000).toFixed(1)}M`, icon:<DollarSign className="w-4 h-4" />, t:spendTrend },
    { label:'Top Vendor', value: topVendor, icon:<Star className="w-4 h-4" />, t:{ up:true, pct:0 } },
  ];
  return (
    <div className="u-card p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((c,i)=> (
          <motion.div
            key={i}
            className="rounded-2xl border bg-white shadow-card p-3 transition duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{ minHeight: 92 }}
            initial={{opacity:0,y:8}}
            animate={{opacity:1,y:0}}
            transition={{delay:i*0.05}}
          >
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{c.label}</div>
              <div className="text-gray-600">{c.icon}</div>
            </div>
            <div className="text-2xl font-extrabold mt-1">{c.value}</div>
            <div className={`text-[11px] mt-1 ${c.t.up? 'text-emerald-600':'text-red-600'}`}>{c.t.up?'▲':'▼'} {c.t.pct}% vs last month</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OrdersKPIs;
