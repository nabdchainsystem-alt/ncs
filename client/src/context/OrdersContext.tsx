import React, { createContext, useContext, useMemo, useState } from 'react';

import { useOrders as useOrdersQuery } from '../features/orders/hooks';
import type { OrderRecord } from '../features/orders/facade';

export type OrderStatus = 'Open' | 'In Progress' | 'Completed' | 'Canceled' | 'On Hold';
export type PaymentStage = { label: string; pct: number; paid: boolean };

export type Order = {
  id: number;
  orderNo: string;
  date: string; // ISO date string or placeholder
  vendor: string;
  items: number;
  value: number;
  status: OrderStatus;
  deliveryDate: string;
  payment: PaymentStage[];
  paymentStatus: string;
  vendorTrust: number | null; // null when not available
  shipMode: 'Sea' | 'Air' | 'Ground' | 'Local';
  origin: string;
  destination: string;
  incoterms: 'FOB' | 'CIF' | 'DAP' | 'EXW' | 'DDP' | '—';
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

const normalizeStatus = (status?: string | null): OrderStatus => {
  if (!status) return 'Open';
  const normalized = status.toLowerCase();
  if (normalized === 'pending' || normalized === 'open') return 'Open';
  if (normalized === 'in progress' || normalized === 'progress') return 'In Progress';
  if (normalized === 'approved' || normalized === 'completed' || normalized === 'closed') return 'Completed';
  if (normalized === 'rejected' || normalized === 'canceled' || normalized === 'cancelled') return 'Canceled';
  if (normalized === 'onhold' || normalized === 'on-hold' || normalized === 'hold') return 'On Hold';
  return 'Open';
};

const formatDate = (value?: string | null): string => {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toISOString().slice(0, 10);
  } catch {
    return '—';
  }
};

const toOrder = (record: OrderRecord): Order => {
  const vendorName = record.vendor?.name ?? '—';
  const totalValue = typeof record.totalValue === 'number' ? record.totalValue : 0;
  const itemCount = Array.isArray((record as any).items) ? (record as any).items.length : 0;

  return {
    id: record.id,
    orderNo: record.orderNo ?? `PO-${record.id}`,
    date: formatDate(record.createdAt),
    vendor: vendorName,
    items: itemCount,
    value: totalValue,
    status: normalizeStatus(record.status),
    deliveryDate: formatDate(record.expectedDelivery),
    payment: [],
    paymentStatus: '—',
    vendorTrust: typeof (record as any).vendor?.trustScore === 'number' ? (record as any).vendor.trustScore : null,
    shipMode: 'Ground',
    origin: record.request?.orderNo ?? '—',
    destination: record.vendor?.code ?? '—',
    incoterms: '—',
    attachments: [],
    timeline: [],
  };
};

export const useOrders = () => {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
};

export const OrdersProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const { data: orderRecords = [] } = useOrdersQuery();

  const orders = useMemo(() => orderRecords.map(toOrder), [orderRecords]);
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
    const leadDays = (o: Order)=> {
      const created = new Date(o.date).getTime();
      const delivery = new Date(o.deliveryDate).getTime();
      if (Number.isNaN(created) || Number.isNaN(delivery)) return 0;
      return (delivery - created)/86400000;
    };
    const validLeadTimes = orders.map(leadDays).filter((n) => Number.isFinite(n) && n > 0);
    const avgLead = validLeadTimes.length ? Math.round(validLeadTimes.reduce((a,b)=>a+b,0)/validLeadTimes.length) : 0;
    const otd = total > 0 ? Math.round((completed/total)*100) : 0;
    const overdue = orders.filter(o=> {
      const delivery = new Date(o.deliveryDate).getTime();
      if (Number.isNaN(delivery)) return false;
      return delivery < Date.now() && o.status!=='Completed' && o.status!=='Canceled';
    }).length;
    return { total, open, progress, completed, canceled, avgLead, otd, value, overdue };
  }, [orders]);

  const riskLevel = (o: Order): 'low'|'med'|'high' => {
    const highValue = o.value > 1_000_000;
    const trustLow = o.vendorTrust != null ? o.vendorTrust < 60 : false;
    const congested = ['Jeddah', 'Dammam'].some((p) => o.destination.includes(p));
    const deliveryTs = new Date(o.deliveryDate).getTime();
    const overdue = !Number.isNaN(deliveryTs) ? deliveryTs < Date.now() && o.status !== 'Completed' : false;
    const score = (trustLow?2:0) + (highValue?2:0) + (congested?1:0) + (overdue?1:0);
    if (score >= 4) return 'high';
    if (score >= 2) return 'med';
    return 'low';
  };

  const delayProbability = (o: Order) => {
    let p = 10;
    if (o.vendorTrust != null && o.vendorTrust < 60) p += 20;
    if (['FOB','EXW'].includes(o.incoterms)) p += 10;
    if (o.shipMode === 'Sea') p += 15;
    if (o.shipMode === 'Air') p += 5;
    if (['Dec','Jan'].includes(new Date().toLocaleString('en',{month:'short'}))) p += 8; // seasonality
    if (['Jeddah', 'Dammam'].some((city) => o.destination.includes(city))) p += 12; // congestion
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
