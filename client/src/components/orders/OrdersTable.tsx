import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders, Order } from '../../context/OrdersContext';
import PaymentBar from './PaymentBar';
import '../../styles/orders.css';

type SortKey = keyof Pick<Order,'orderNo'|'date'|'vendor'|'items'|'value'|'status'|'deliveryDate'|'paymentStatus'>;

export default function OrdersTable() {
  const { view, riskLevel, openDetails, delayProbability } = useOrders();
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [dir, setDir] = useState<'asc'|'desc'>('desc');

  const sorted = useMemo(()=>{
    const arr=[...view];
    arr.sort((a,b)=>{
      let va: any = (a as any)[sortKey];
      let vb: any = (b as any)[sortKey];
      if (sortKey==='items' || sortKey==='value') { va=Number(va); vb=Number(vb); }
      if (sortKey==='date' || sortKey==='deliveryDate') { va = new Date(va).getTime(); vb=new Date(vb).getTime(); }
      if (typeof va==='string') { va=va.toLowerCase(); vb=String(vb).toLowerCase(); }
      if (va<vb) return dir==='asc'?-1:1; if (va>vb) return dir==='asc'?1:-1; return 0;
    });
    return arr;
  }, [view, sortKey, dir]);

  const Th = ({k,label}:{k:SortKey;label:string}) => (
    <th onClick={()=> setSortKey((s)=> s===k ? (setDir(d=>d==='asc'?'desc':'asc'), k) : (setDir('asc'), k))}>
      <span className="inline-flex items-center gap-1 cursor-pointer select-none">{label}{sortKey===k? <span className="text-gray-400 text-[11px]">{dir==='asc'?'▲':'▼'}</span>: <span className="text-gray-300 text-[11px]">▲</span>}</span>
    </th>
  );

  const rowClass = (o: Order) => {
    const r = riskLevel(o);
    return r==='high'?'risk-high': r==='med'?'risk-med':'risk-low';
  };

  return (
    <div className="orders-card p-0">
      <div className="px-4 pt-4 pb-2 font-semibold">Orders Table</div>
      <div className="table-wrap overflow-auto">
        <table className="orders-table">
          <thead>
            <tr>
              <Th k="orderNo" label="Order No" />
              <Th k="date" label="Date" />
              <Th k="vendor" label="Vendor" />
              <Th k="items" label="Items" />
              <Th k="value" label="Value" />
              <Th k="status" label="Status" />
              <Th k="deliveryDate" label="Delivery Date" />
              <Th k="paymentStatus" label="Payment" />
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {sorted.map((o)=> (
                <motion.tr key={o.id} layout initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={rowClass(o)}>
                  <td className="font-semibold">{o.orderNo}</td>
                  <td>{o.date}</td>
                  <td>{o.vendor}</td>
                  <td>{o.items}</td>
                  <td>{o.value.toLocaleString()} SAR</td>
                  <td>
                    <span className={`status-badge ${o.status==='Open'?'open': o.status==='In Progress'?'progress': o.status==='Completed'?'done':'canceled'}`}>{o.status}</span>
                  </td>
                  <td>{o.deliveryDate}</td>
                  <td style={{minWidth:140}}>
                    <PaymentBar stages={o.payment} />
                  </td>
                  <td className="orders-actions">
                    <div className="flex gap-2">
                      <button className="btn" onClick={() => openDetails(o)}>View</button>
                      <button className="btn">Track</button>
                      <button className="btn">Docs</button>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">AI Delay: {delayProbability(o)}%</div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
