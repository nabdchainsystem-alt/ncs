import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventory, InvItem } from '../../context/InventoryContext';
import { PackagePlus, MoveRight, Pencil } from 'lucide-react';
import '../../styles/inventory.css';

type SortKey = keyof Pick<InvItem, 'name'|'code'|'category'|'qty'|'unit'|'minLevel'|'expiry'|'warehouse'>;

function statusOf(it: InvItem): 'ok'|'low'|'out' {
  if (it.qty <= 0) return 'out';
  if (it.qty < it.minLevel) return 'low';
  return 'ok';
}

const StockTable: React.FC = () => {
  const { view } = useInventory();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [dir, setDir] = useState<'asc'|'desc'>('asc');

  const sorted = useMemo(() => {
    const arr = [...view];
    arr.sort((a,b) => {
      let va: any = (a as any)[sortKey];
      let vb: any = (b as any)[sortKey];
      if (sortKey === 'qty' || sortKey === 'minLevel') { va = Number(va); vb = Number(vb); }
      else { va = String(va ?? '').toLowerCase(); vb = String(vb ?? '').toLowerCase(); }
      if (va < vb) return dir === 'asc' ? -1 : 1;
      if (va > vb) return dir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [view, sortKey, dir]);

  const SwitchSort: React.FC<{ k: SortKey; label: string }> = ({ k, label }) => (
    <th onClick={() => setSortKey((s)=> s===k ? (setDir(d=> d==='asc'?'desc':'asc'), k) : (setDir('asc'), k))}>
      <span className="inline-flex items-center gap-1 cursor-pointer select-none">
        {label}
        {sortKey === k ? <span className="text-gray-400 text-[11px]">{dir==='asc'?'▲':'▼'}</span> : <span className="text-gray-300 text-[11px]">▲</span>}
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
              <SwitchSort k="name" label="Item Name" />
              <SwitchSort k="code" label="Item Code" />
              <SwitchSort k="category" label="Category" />
              <SwitchSort k="qty" label="Qty" />
              <SwitchSort k="unit" label="Unit" />
              <SwitchSort k="minLevel" label="Min Level" />
              <SwitchSort k="expiry" label="Expiry Date" />
              <th>Supplier Risk</th>
              <SwitchSort k="warehouse" label="Warehouse" />
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {sorted.map((it) => (
                <motion.tr key={it.id} layout initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                  <td>{it.name}</td>
                  <td>{it.code}</td>
                  <td>{it.category}</td>
                  <td style={{ textAlign:'center', whiteSpace:'nowrap' }}>{it.qty.toLocaleString()}</td>
                  <td style={{ textAlign:'center', whiteSpace:'nowrap' }}>{it.unit}</td>
                  <td style={{ textAlign:'center', whiteSpace:'nowrap' }}>{it.minLevel}</td>
                  <td style={{ textAlign:'center', whiteSpace:'nowrap' }}>{it.expiry ? String(it.expiry).slice(0,10) : '—'}</td>
                  <td>
                    <span className="inv-chip"><span className="dot" style={{ background: it.supplierRisk==='Single'?'#F59E0B':'#10B981' }} />{it.supplierRisk}</span>
                  </td>
                  <td style={{ whiteSpace:'nowrap' }}>{it.warehouse}</td>
                  <td>
                    <span className={`inv-badge ${statusOf(it)}`}>{statusOf(it).toUpperCase()}</span>
                  </td>
                  <td>
                    <div className="inv-actions flex gap-2">
                      <button className="btn icon-btn" title="Reorder"><PackagePlus size={16} /></button>
                      <button className="btn icon-btn" title="Transfer"><MoveRight size={16} /></button>
                      <button className="btn icon-btn" title="Edit"><Pencil size={16} /></button>
                    </div>
                  </td>
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
