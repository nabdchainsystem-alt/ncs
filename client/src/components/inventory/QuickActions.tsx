import React from 'react';
import '../../styles/inventory.css';
import { useInventory } from '../../context/InventoryContext';

const QuickActions: React.FC = () => {
  const { view, receive, issue, transfer } = useInventory();
  const [open, setOpen] = React.useState<null | 'receive' | 'issue' | 'transfer' | 'report'>(null);
  const [qty, setQty] = React.useState(1);
  const [itemId, setItemId] = React.useState<number | null>(null);
  const [toWh, setToWh] = React.useState<'Riyadh'|'Dammam'|'Jeddah'>('Riyadh');

  const list = view.slice(0, 20);
  const close = () => { setOpen(null); setQty(1); setItemId(null); };

  const submit = () => {
    if (!itemId) return;
    if (open === 'receive') receive(itemId, qty);
    if (open === 'issue') issue(itemId, qty);
    if (open === 'transfer') transfer(itemId, toWh, qty);
    if (open === 'report') {
      // handled in page via export
    }
    close();
  };

  return (
    <div className="inv-quick flex flex-wrap gap-2">
      <button className="btn receive" onClick={() => setOpen('receive')}>📥 Receive</button>
      <button className="btn issue" onClick={() => setOpen('issue')}>📤 Issue</button>
      <button className="btn transfer" onClick={() => setOpen('transfer')}>🔁 Transfer</button>
      <button className="btn report" onClick={() => setOpen('report')}>📊 Report</button>

      {open && (
        <div className="inv-overlay">
          <div className="inv-modal">
            <div className="head">
              <div>{open === 'receive' ? 'Receive Stock' : open === 'issue' ? 'Issue Stock' : open === 'transfer' ? 'Transfer Stock' : 'Generate Report'}</div>
              <button onClick={close} className="text-sm px-2 py-1 border rounded">✕</button>
            </div>
            <div className="body grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-gray-600">Item</span>
                <select className="border rounded px-2 py-2" value={itemId ?? ''} onChange={(e)=> setItemId(Number(e.target.value)||null)}>
                  <option value="">Select item...</option>
                  {list.map((it)=> <option key={it.id} value={it.id}>{it.name} • {it.code}</option>)}
                </select>
              </label>
              {open !== 'report' && (
                <label className="grid gap-1 text-sm">
                  <span className="text-gray-600">Quantity</span>
                  <input type="number" min={1} value={qty} onChange={(e)=> setQty(Math.max(1, Number(e.target.value)||1))} className="border rounded px-2 py-2 w-32" />
                </label>
              )}
              {open === 'transfer' && (
                <label className="grid gap-1 text-sm">
                  <span className="text-gray-600">To Warehouse</span>
                  <select className="border rounded px-2 py-2" value={toWh} onChange={(e)=> setToWh(e.target.value as any)}>
                    {['Riyadh','Dammam','Jeddah'].map((w)=> <option key={w} value={w}>{w}</option>)}
                  </select>
                </label>
              )}
              {open === 'report' && (
                <div className="text-sm text-gray-600">Use Export from header to download a CSV snapshot of current view.</div>
              )}
            </div>
            <div className="foot">
              <button onClick={close} className="px-3 py-2 border rounded">Cancel</button>
              <button onClick={submit} className="px-3 py-2 bg-gray-900 text-white rounded">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickActions;

