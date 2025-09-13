import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventory, InvItem } from '../../context/InventoryContext';
import '../../styles/inventory.css';

// Updated sorting keys to match requested columns
type SortKey = keyof Pick<InvItem, 'code' | 'name' | 'qty' | 'unit' | 'minLevel' | 'warehouse' | 'location' | 'category'>;

const StockTable: React.FC = () => {
  const { view } = useInventory();
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    const arr = [...view];
    arr.sort((a, b) => {
      let va: any = (a as any)[sortKey];
      let vb: any = (b as any)[sortKey];
      if (sortKey === 'qty' || sortKey === 'minLevel') {
        va = Number(va);
        vb = Number(vb);
      } else {
        va = String(va ?? '').toLowerCase();
        vb = String(vb ?? '').toLowerCase();
      }
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [view, sortKey, dir]);

  const SwitchSort: React.FC<{ k: SortKey; label: string }> = ({ k, label }) => (
    <th onClick={() => setSortKey((s) => (s === k ? (setDir((d) => (d === 'asc' ? 'desc' : 'asc')), k) : (setDir('asc'), k)))}>
      <span className="inline-flex items-center gap-1 cursor-pointer select-none">
        {label}
        {sortKey === k ? <span className="text-gray-400 text-[11px]">{dir === 'asc' ? '▲' : '▼'}</span> : <span className="text-gray-300 text-[11px]">▲</span>}
      </span>
    </th>
  );

  return (
    <div className="inv-card p-0">
      <div className="px-4 pt-4 pb-2 font-semibold">Stock Table</div>
      <div className="overflow-auto">
        <table className="inv-table">
          <thead>
            <tr>
              <SwitchSort k="code" label="Material Code" />
              <SwitchSort k="name" label="Material Description" />
              <SwitchSort k="qty" label="Quantity" />
              <SwitchSort k="unit" label="Unit" />
              <SwitchSort k="minLevel" label="Min Stock Level" />
              <SwitchSort k="warehouse" label="Warehouse" />
              <SwitchSort k="location" label="Location" />
              <SwitchSort k="category" label="Category" />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {sorted.map((it) => (
                <motion.tr key={it.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <td>{it.code}</td>
                  <td>{it.name}</td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{it.qty.toLocaleString()}</td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{it.unit}</td>
                  <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>{it.minLevel}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{it.warehouse}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{it.location || '—'}</td>
                  <td>{it.category}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockTable;
