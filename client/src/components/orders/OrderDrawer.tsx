import React, { useEffect, useRef } from 'react';
import { useOrders } from '../../context/OrdersContext';
import PaymentBar from './PaymentBar';
import '../../styles/orders.css';

const OrderDrawer: React.FC = () => {
  const { details: o, closeDetails, delayProbability, co2For } = useOrders();
  const dotRef = useRef<HTMLDivElement | null>(null);
  useEffect(()=>{
    if (!o) return;
    let t=0; let raf:number; const run=()=>{ t=(t+1)%100; if(dotRef.current){ (dotRef.current as HTMLDivElement).style.left=`${10 + 0.8*t}%`; } raf=requestAnimationFrame(run); }; raf=requestAnimationFrame(run); return ()=> cancelAnimationFrame(raf);
  },[o]);
  if (!o) return null;
  return (
    <div className="drawer">
      <div className="drawer-head">
        <div className="font-bold">{o.orderNo} — {o.vendor}</div>
        <button className="px-2 py-1 border rounded" onClick={closeDetails}>✕</button>
      </div>
      <div className="drawer-body grid gap-4">
        <section>
          <div className="font-semibold mb-1">Timeline</div>
          <div className="timeline">
            {o.timeline.map((t,i)=> (
              <div key={i} className={`tick ${t.done?'done':''}`}>
                <div className="text-sm"><b>{t.label}</b> {t.at? <span className="text-gray-500">— {t.at}</span>:null}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="orders-card p-3">
            <div className="text-sm text-gray-600">Payment Progress</div>
            <div className="mt-2"><PaymentBar stages={o.payment} /></div>
            <div className="text-[11px] text-gray-500 mt-1">{o.payment.map(p=>`${p.label}: ${p.pct}% ${p.paid?'✓':''}`).join(' • ')}</div>
          </div>
          <div className="orders-card p-3">
            <div className="text-sm text-gray-600">Live Shipment</div>
            <div className="mini-map mt-2">
              <div className="route" />
              <div ref={dotRef} className="dot" style={{ left:'10%' }} />
              <div className="absolute left-2 top-2 text-[11px] text-gray-600">{o.origin}</div>
              <div className="absolute right-2 bottom-2 text-[11px] text-gray-600">{o.destination}</div>
            </div>
            <div className="text-[11px] text-gray-500 mt-1">Mode: {o.shipMode} • ETA: {o.deliveryDate}</div>
          </div>
        </section>

        <section className="orders-card p-3">
          <div className="font-semibold mb-1">AI Delay Prediction</div>
          <div className="text-sm">Probability of delay: <b>{delayProbability(o)}%</b></div>
          <div className="text-[12px] text-gray-500">Based on vendor trust, incoterms, congestion and mode.</div>
        </section>

        <section className="orders-card p-3">
          <div className="font-semibold mb-2">CO₂ Impact</div>
          <div className="text-sm">Estimated: <b>{co2For(o)} kg</b> CO₂</div>
          <div className="text-[12px] text-gray-500">Mode factor taken into account.</div>
        </section>

        <section className="orders-card p-3">
          <div className="font-semibold mb-2">Documents</div>
          <ul className="text-sm list-disc pl-5">
            {o.attachments.length? o.attachments.map((a,i)=>(<li key={i}>{a.name}</li>)) : <li className="text-gray-500">No documents uploaded</li>}
          </ul>
        </section>

        <section className="orders-card p-3">
          <div className="font-semibold mb-2">Negotiation AI Bot</div>
          <div className="text-sm text-gray-700">“ممكن تقلل السعر 3% لو دفعت مقدم. ولو دمجت طلبين هنوفر 5 أيام Lead Time.”</div>
          <div className="text-[12px] text-gray-500 mt-1">Use these insights before talking to vendor.</div>
        </section>
      </div>
      <div className="drawer-foot">
        <button className="px-3 py-2 border rounded" onClick={closeDetails}>Close</button>
        <button className="px-3 py-2 bg-gray-900 text-white rounded">Create GRN</button>
      </div>
    </div>
  );
};

export default OrderDrawer;

