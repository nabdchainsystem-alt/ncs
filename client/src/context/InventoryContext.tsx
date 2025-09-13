import React, { createContext, useContext, useMemo, useState } from 'react';

export type InvItem = {
  id: number;
  name: string;               // Material Description
  code: string;               // Material Code
  category: string;
  qty: number;                // Quantity
  unit: string;               // Unit
  minLevel: number;           // Min Stock Level
  warehouse: 'Riyadh' | 'Dammam' | 'Jeddah';
  location?: string | null;   // Location
  expiry?: string | null;     // optional (kept for compatibility)
  supplierRisk: 'Single' | 'Multiple'; // kept for KPIs (not shown in table)
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
  addItem: (it: Omit<InvItem, 'id'>) => void;
  receive: (id: number, qty: number) => void;
  issue: (id: number, qty: number) => void;
  transfer: (id: number, to: InvItem['warehouse'], qty: number) => void;
  exportCsv: () => void;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

function sampleItems(): InvItem[] {
  return [
    { id: 1, name: 'Ball Bearing 6204', code: 'BRG-6204', category: 'Spare Parts', qty: 120, unit: 'pcs', minLevel: 40, warehouse: 'Riyadh', location: 'A1-01', expiry: null, supplierRisk: 'Multiple' },
    { id: 2, name: 'Motor 2.2kW', code: 'MTR-22', category: 'Equipment', qty: 6, unit: 'pcs', minLevel: 10, warehouse: 'Jeddah', location: 'E2-07', expiry: null, supplierRisk: 'Single' },
    { id: 3, name: 'Air Filter A12', code: 'FLT-A12', category: 'Consumables', qty: 14, unit: 'pcs', minLevel: 20, warehouse: 'Dammam', location: 'C3-11', expiry: '2025-12-10', supplierRisk: 'Multiple' },
    { id: 4, name: 'Hydraulic Hose 1"', code: 'HOS-1', category: 'Spare Parts', qty: 0, unit: 'm', minLevel: 25, warehouse: 'Riyadh', location: 'B1-05', expiry: null, supplierRisk: 'Single' },
    { id: 5, name: 'Grease EP2', code: 'GRS-EP2', category: 'Chemicals', qty: 45, unit: 'kg', minLevel: 30, warehouse: 'Jeddah', location: 'D4-02', expiry: '2026-06-01', supplierRisk: 'Multiple' },
    { id: 6, name: 'Conveyor Belt B-88', code: 'BLT-B88', category: 'Equipment', qty: 2, unit: 'pcs', minLevel: 6, warehouse: 'Dammam', location: 'E1-09', expiry: null, supplierRisk: 'Single' },
    { id: 7, name: 'Sensor Prox M12', code: 'SNS-M12', category: 'Electronics', qty: 80, unit: 'pcs', minLevel: 30, warehouse: 'Riyadh', location: 'A2-03', expiry: null, supplierRisk: 'Multiple' },
    { id: 8, name: 'Valve 2-way 1"', code: 'VLV-1', category: 'Spare Parts', qty: 16, unit: 'pcs', minLevel: 18, warehouse: 'Jeddah', location: 'B2-08', expiry: null, supplierRisk: 'Multiple' },
    { id: 9, name: 'Mask N95', code: 'MSK-N95', category: 'Safety', qty: 260, unit: 'pcs', minLevel: 50, warehouse: 'Riyadh', location: 'A3-10', expiry: '2026-09-01', supplierRisk: 'Multiple' },
    { id: 10, name: 'Gloves Nitrile', code: 'GLV-N', category: 'Safety', qty: 0, unit: 'box', minLevel: 12, warehouse: 'Dammam', location: 'C1-04', expiry: '2025-04-01', supplierRisk: 'Multiple' },
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
      const qok = !q || [it.name, it.code, it.category, it.warehouse, it.location]
        .some((s) => String(s ?? '').toLowerCase().includes(q));
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

  const addItem = (it: Omit<InvItem, 'id'>) => setItems((arr)=> [...arr, { id: Math.max(0, ...arr.map(a=>a.id))+1, ...it }]);
  const receive = (id: number, qty: number) => setItems((arr) => arr.map((x) => (x.id === id ? { ...x, qty: x.qty + Math.max(0, qty) } : x)));
  const issue = (id: number, qty: number) => setItems((arr) => arr.map((x) => (x.id === id ? { ...x, qty: Math.max(0, x.qty - Math.max(0, qty)) } : x)));
  const transfer = (id: number, to: InvItem['warehouse'], qty: number) => setItems((arr) => arr.map((x) => (x.id === id ? { ...x, qty: Math.max(0, x.qty - Math.max(0, qty)) } : x))); // naive for demo

  const exportCsv = () => {
    // Export with the requested visible columns
    const headers = ['Material Code','Material Description','Quantity','Unit','Min Stock Level','Warehouse','Location','Category'];
    const lines = [headers.join(',')];
    for (const it of view) {
      lines.push([
        it.code,
        it.name,
        it.qty,
        it.unit,
        it.minLevel,
        it.warehouse,
        it.location || '',
        it.category,
      ].map((v)=>`"${String(v).replace(/"/g,'""')}"`).join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'inventory.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const value: InventoryContextValue = useMemo(() => ({
    query, setQuery, filters, setFilters, items, view, kpis, addItem, receive, issue, transfer, exportCsv,
  }), [query, filters, items, view, kpis]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
};

export default InventoryContext;
