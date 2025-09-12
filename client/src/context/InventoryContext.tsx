import React, { createContext, useContext, useMemo, useState } from 'react';

export type InvItem = {
  id: number;
  name: string;
  code: string;
  category: string;
  qty: number;
  unit: string;
  minLevel: number;
  expiry?: string | null;
  supplierRisk: 'Single' | 'Multiple';
  warehouse: 'Riyadh' | 'Dammam' | 'Jeddah';
};

export type InvFilters = {
  warehouse?: string;
  category?: string;
  supplier?: string; // placeholder
  expiryFrom?: string | null;
  expiryTo?: string | null;
  valueMin?: number | null;
  valueMax?: number | null;
};

export type InventoryContextValue = {
  query: string;
  setQuery: (q: string) => void;
  filters: InvFilters;
  setFilters: (p: Partial<InvFilters>) => void;
  items: InvItem[];
  view: InvItem[]; // filtered view
  kpis: {
    total: number; low: number; out: number; categories: number; value: number; turnover: number; coverageDays: number;
  };
  receive: (id: number, qty: number) => void;
  issue: (id: number, qty: number) => void;
  transfer: (id: number, to: InvItem['warehouse'], qty: number) => void;
  exportCsv: () => void;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

function sampleItems(): InvItem[] {
  return [
    { id: 1, name: 'Ball Bearing 6204', code: 'BRG-6204', category: 'Spare Parts', qty: 120, unit: 'pcs', minLevel: 40, expiry: null, supplierRisk: 'Multiple', warehouse: 'Riyadh' },
    { id: 2, name: 'Motor 2.2kW', code: 'MTR-22', category: 'Equipment', qty: 6, unit: 'pcs', minLevel: 10, expiry: null, supplierRisk: 'Single', warehouse: 'Jeddah' },
    { id: 3, name: 'Air Filter A12', code: 'FLT-A12', category: 'Consumables', qty: 14, unit: 'pcs', minLevel: 20, expiry: '2025-12-10', supplierRisk: 'Multiple', warehouse: 'Dammam' },
    { id: 4, name: 'Hydraulic Hose 1"', code: 'HOS-1', category: 'Spare Parts', qty: 0, unit: 'm', minLevel: 25, expiry: null, supplierRisk: 'Single', warehouse: 'Riyadh' },
    { id: 5, name: 'Grease EP2', code: 'GRS-EP2', category: 'Chemicals', qty: 45, unit: 'kg', minLevel: 30, expiry: '2026-06-01', supplierRisk: 'Multiple', warehouse: 'Jeddah' },
    { id: 6, name: 'Conveyor Belt B-88', code: 'BLT-B88', category: 'Equipment', qty: 2, unit: 'pcs', minLevel: 6, expiry: null, supplierRisk: 'Single', warehouse: 'Dammam' },
    { id: 7, name: 'Sensor Prox M12', code: 'SNS-M12', category: 'Electronics', qty: 80, unit: 'pcs', minLevel: 30, expiry: null, supplierRisk: 'Multiple', warehouse: 'Riyadh' },
    { id: 8, name: 'Valve 2-way 1"', code: 'VLV-1', category: 'Spare Parts', qty: 16, unit: 'pcs', minLevel: 18, expiry: null, supplierRisk: 'Multiple', warehouse: 'Jeddah' },
    { id: 9, name: 'Mask N95', code: 'MSK-N95', category: 'Safety', qty: 260, unit: 'pcs', minLevel: 50, expiry: '2026-09-01', supplierRisk: 'Multiple', warehouse: 'Riyadh' },
    { id: 10, name: 'Gloves Nitrile', code: 'GLV-N', category: 'Safety', qty: 0, unit: 'box', minLevel: 12, expiry: '2025-04-01', supplierRisk: 'Multiple', warehouse: 'Dammam' },
  ];
}

export const useInventory = () => {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used within InventoryProvider');
  return ctx;
};

export const InventoryProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [query, setQuery] = useState('');
  const [filters, setFiltersState] = useState<InvFilters>({});
  const [items, setItems] = useState<InvItem[]>(sampleItems());

  const setFilters = (p: Partial<InvFilters>) => setFiltersState((s) => ({ ...s, ...p }));

  const view = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const qok = !q || [it.name, it.code, it.category, it.warehouse].some((s) => String(s).toLowerCase().includes(q));
      const wok = !filters.warehouse || it.warehouse === filters.warehouse;
      const cok = !filters.category || it.category === filters.category;
      return qok && wok && cok;
    });
  }, [items, query, filters]);

  const kpis = useMemo(() => {
    const total = items.length;
    const low = items.filter((i) => i.qty > 0 && i.qty < i.minLevel).length;
    const out = items.filter((i) => i.qty <= 0).length;
    const categories = new Set(items.map((i) => i.category)).size;
    // demo value: qty * coefficient
    const value = Math.round(items.reduce((s, i) => s + i.qty * (i.category === 'Equipment' ? 1200 : 60), 0));
    const turnover = 4.2; // placeholder
    const coverageDays = 45; // placeholder
    return { total, low, out, categories, value, turnover, coverageDays };
  }, [items]);

  const receive = (id: number, qty: number) => setItems((arr) => arr.map((x) => (x.id === id ? { ...x, qty: x.qty + Math.max(0, qty) } : x)));
  const issue = (id: number, qty: number) => setItems((arr) => arr.map((x) => (x.id === id ? { ...x, qty: Math.max(0, x.qty - Math.max(0, qty)) } : x)));
  const transfer = (id: number, to: InvItem['warehouse'], qty: number) => setItems((arr) => arr.map((x) => (x.id === id ? { ...x, qty: Math.max(0, x.qty - Math.max(0, qty)) } : x))); // naive for demo

  const exportCsv = () => {
    const headers = ['name','code','category','qty','unit','minLevel','expiry','supplierRisk','warehouse'];
    const lines = [headers.join(',')];
    for (const it of view) {
      lines.push([it.name,it.code,it.category,it.qty,it.unit,it.minLevel,it.expiry||'',it.supplierRisk,it.warehouse].map((v)=>`"${String(v).replace(/"/g,'""')}"`).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inventory.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const value: InventoryContextValue = useMemo(() => ({
    query, setQuery, filters, setFilters, items, view, kpis, receive, issue, transfer, exportCsv,
  }), [query, filters, items, view, kpis]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export default InventoryContext;

