import React, { createContext, useContext, useMemo, useState } from 'react';

export type OrderStatus = 'Open' | 'In Progress' | 'Completed' | 'Canceled';
export type PaymentStage = { label: string; pct: number; paid: boolean };

export type Order = {
  id: number;
  orderNo: string;
  date: string; // ISO
  vendor: string;
  items: number;
  value: number; // SAR
  status: OrderStatus;
  deliveryDate: string;
  payment: PaymentStage[];
  paymentStatus: string; // e.g., 30/70
  vendorTrust: number; // 0..100
  shipMode: 'Sea' | 'Air' | 'Ground' | 'Local';
  origin: string;
  destination: string;
  incoterms: 'FOB' | 'CIF' | 'DAP' | 'EXW' | 'DDP';
  attachments: Array<{ name: string; type: string; size?: string }>;
  timeline: Array<{ label: string; at?: string; done: boolean }>;
};

export type OrdersFilters = {
  vendor?: string;
  status?: OrderStatus | 'All';
  from?: string | null;
  to?: string | null;
  min?: number | null; // value range
  max?: number | null;
};

export type OrdersContextValue = {
  query: string; setQuery: (q: string)=>void;
  filters: OrdersFilters; setFilters: (p: Partial<OrdersFilters>)=>void; resetFilters: ()=>void;
  orders: Order[]; view: Order[];
  kpis: { total: number; open: number; progress: number; completed: number; canceled: number; avgLead: number; otd: number; value: number; overdue: number; };
  riskLevel: (o: Order)=>'low'|'med'|'high';
  delayProbability: (o: Order)=>number;
  co2For: (o: Order)=>number;
  openDetails: (o: Order)=>void; closeDetails: ()=>void; details: Order | null;
  toggleHologram: ()=>void; hologram: boolean;
};

const OrdersContext = createContext<OrdersContextValue | null>(null);

function mockOrders(): Order[] {
  const fmt = (d: Date) => d.toISOString().slice(0,10);
  const today = new Date();
  const addDays = (n: number) => fmt(new Date(Date.now()+n*86400000));
  return [
    { id:1, orderNo:'PO-2001', date: addDays(-25), vendor:'Alpha Supplies Co.', items:8, value: 420000, status:'In Progress', deliveryDate: addDays(7), payment: [ {label:'Advance 30%', pct:30, paid:true}, {label:'On-Delivery 40%', pct:40, paid:false}, {label:'After Acceptance 30%', pct:30, paid:false} ], paymentStatus:'30/70', vendorTrust: 85, shipMode:'Sea', origin:'Shanghai', destination:'Jeddah', incoterms:'CIF', attachments:[{name:'invoice-2001.pdf',type:'invoice'}], timeline:[{label:'Issued',done:true,at:addDays(-25)},{label:'Approved',done:true,at:addDays(-23)},{label:'Dispatched',done:true,at:addDays(-5)},{label:'Delivered',done:false},{label:'Closed',done:false}] },
    { id:2, orderNo:'PO-2002', date: addDays(-15), vendor:'Beta Electrics Ltd.', items:3, value: 1250000, status:'Open', deliveryDate: addDays(20), payment: [ {label:'Advance 20%', pct:20, paid:false}, {label:'On-Delivery 60%', pct:60, paid:false}, {label:'After Acceptance 20%', pct:20, paid:false} ], paymentStatus:'0/100', vendorTrust: 58, shipMode:'Sea', origin:'Mumbai', destination:'Jeddah', incoterms:'FOB', attachments:[{name:'contract-2002.pdf',type:'contract'}], timeline:[{label:'Issued',done:true,at:addDays(-15)},{label:'Approved',done:false},{label:'Dispatched',done:false},{label:'Delivered',done:false},{label:'Closed',done:false}] },
    { id:3, orderNo:'PO-2003', date: addDays(-5), vendor:'Gamma Industrial', items:12, value: 180000, status:'In Progress', deliveryDate: addDays(10), payment: [ {label:'Advance 30%', pct:30, paid:true}, {label:'On-Delivery 40%', pct:40, paid:false}, {label:'After Acceptance 30%', pct:30, paid:false} ], paymentStatus:'30/70', vendorTrust: 72, shipMode:'Air', origin:'Frankfurt', destination:'Riyadh', incoterms:'DAP', attachments:[], timeline:[{label:'Issued',done:true,at:addDays(-5)},{label:'Approved',done:true,at:addDays(-4)},{label:'Dispatched',done:false},{label:'Delivered',done:false},{label:'Closed',done:false}] },
    { id:4, orderNo:'PO-2004', date: addDays(-40), vendor:'Delta Logistics', items:5, value: 220000, status:'Completed', deliveryDate: addDays(-2), payment: [ {label:'Advance 30%', pct:30, paid:true}, {label:'On-Delivery 40%', pct:40, paid:true}, {label:'After Acceptance 30%', pct:30, paid:true} ], paymentStatus:'100/0', vendorTrust: 91, shipMode:'Ground', origin:'Jeddah', destination:'Riyadh', incoterms:'DDP', attachments:[{name:'grn-2004.pdf',type:'grn'}], timeline:[{label:'Issued',done:true,at:addDays(-40)},{label:'Approved',done:true,at:addDays(-38)},{label:'Dispatched',done:true,at:addDays(-20)},{label:'Delivered',done:true,at:addDays(-2)},{label:'Closed',done:true,at:addDays(-1)}] },
    { id:5, orderNo:'PO-2005', date: addDays(-18), vendor:'Epsilon Metals', items:9, value: 760000, status:'Open', deliveryDate: addDays(3), payment: [ {label:'Advance 30%', pct:30, paid:false}, {label:'On-Delivery 40%', pct:40, paid:false}, {label:'After Acceptance 30%', pct:30, paid:false} ], paymentStatus:'0/100', vendorTrust: 66, shipMode:'Sea', origin:'Shenzhen', destination:'Dammam', incoterms:'FOB', attachments:[], timeline:[{label:'Issued',done:true,at:addDays(-18)},{label:'Approved',done:true,at:addDays(-17)},{label:'Dispatched',done:true,at:addDays(-10)},{label:'Delivered',done:false},{label:'Closed',done:false}] },
  ];
}

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
};

export const OrdersProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [orders] = useState<Order[]>(mockOrders());
  const [query, setQuery] = useState('');
  const [filters, setFiltersState] = useState<OrdersFilters>({ status: 'All' });
  const [details, setDetails] = useState<Order | null>(null);
  const [hologram, setHologram] = useState(false);

  const setFilters = (p: Partial<OrdersFilters>) => setFiltersState((s)=> ({ ...s, ...p }));
  const resetFilters = () => setFiltersState({ status: 'All' });

  const view = useMemo(()=>{
    const q = query.trim().toLowerCase();
    return orders.filter(o => {
      const qok = !q || [o.orderNo,o.vendor,o.incoterms,o.origin,o.destination].some(s=> String(s).toLowerCase().includes(q));
      const sok = !filters.status || filters.status==='All' || o.status===filters.status;
      const vok = !filters.vendor || o.vendor===filters.vendor;
      const fromOk = !filters.from || o.date >= filters.from;
      const toOk = !filters.to || o.date <= filters.to;
      const minOk = filters.min==null || o.value >= filters.min!;
      const maxOk = filters.max==null || o.value <= filters.max!;
      return qok && sok && vok && fromOk && toOk && minOk && maxOk;
    });
  }, [orders, query, filters]);

  const kpis = useMemo(()=>{
    const total = orders.length;
    const open = orders.filter(o=>o.status==='Open').length;
    const progress = orders.filter(o=>o.status==='In Progress').length;
    const completed = orders.filter(o=>o.status==='Completed').length;
    const canceled = orders.filter(o=>o.status==='Canceled').length;
    const value = Math.round(orders.reduce((s,o)=>s+o.value,0));
    const leadDays = (o: Order)=> (new Date(o.deliveryDate).getTime()-new Date(o.date).getTime())/86400000;
    const avgLead = Math.round(orders.reduce((s,o)=>s+leadDays(o),0)/Math.max(1,orders.length));
    const otd = Math.round((orders.filter(o=>o.status==='Completed').length/Math.max(1,orders.length))*100);
    const overdue = orders.filter(o=> new Date(o.deliveryDate).getTime() < Date.now() && o.status!=='Completed' && o.status!=='Canceled').length;
    return { total, open, progress, completed, canceled, avgLead, otd, value, overdue };
  }, [orders]);

  const riskLevel = (o: Order): 'low'|'med'|'high' => {
    const highValue = o.value > 1_000_000;
    const trustLow = o.vendorTrust < 60;
    const congested = ['Jeddah'].some(p=> o.destination.includes(p));
    const overdue = new Date(o.deliveryDate).getTime() < Date.now();
    const score = (trustLow?2:0) + (highValue?2:0) + (congested?1:0) + (overdue?1:0) + (o.shipMode==='Air'?1:0);
    if (score >= 4) return 'high';
    if (score >= 2) return 'med';
    return 'low';
  };

  const delayProbability = (o: Order) => {
    let p = 10;
    if (o.vendorTrust < 60) p += 25;
    if (['FOB','EXW'].includes(o.incoterms)) p += 10;
    if (o.shipMode === 'Sea') p += 15;
    if (o.shipMode === 'Air') p += 5;
    if (['Dec','Jan'].includes(new Date().toLocaleString('en',{month:'short'}))) p += 8; // seasonality
    if (['Jeddah'].some(pn=>o.destination.includes(pn))) p += 12; // congestion
    return Math.min(95, p);
  };

  const co2For = (o: Order) => {
    const base = o.value / 10000; // proxy for weight
    const mode = o.shipMode;
    const factor = mode==='Air'?3.2: mode==='Sea'?0.8: mode==='Ground'?1.2:0.4;
    return Math.round(base * factor);
  };

  const openDetails = (o: Order) => setDetails(o);
  const closeDetails = () => setDetails(null);
  const toggleHologram = () => setHologram((v)=>!v);

  const value: OrdersContextValue = useMemo(()=>({
    query, setQuery, filters, setFilters, resetFilters, orders, view, kpis, riskLevel, delayProbability, co2For, openDetails, closeDetails, details, toggleHologram, hologram,
  }), [query, filters, orders, view, kpis, details, hologram]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
};

export default OrdersContext;

