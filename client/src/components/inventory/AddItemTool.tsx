import React from 'react';
import { useInventory, InvItem } from '../../context/InventoryContext';

const categories = ['Raw Material','Spare Part','Packaging','Finished Product'];
const warehouses: InvItem['warehouse'][] = ['Riyadh','Dammam','Jeddah'];

export default function AddItemTool() {
  const { items, addItem } = useInventory();
  const [open, setOpen] = React.useState(false);

  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const [cat, setCat] = React.useState(categories[0]);
  const [uom, setUom] = React.useState('pcs');
  const [min, setMin] = React.useState(0);
  const [qty, setQty] = React.useState(0);
  const [wh, setWh] = React.useState<InvItem['warehouse']>('Riyadh');
  const [location, setLocation] = React.useState<string>('');
  const [dept, setDept] = React.useState('Production');
  const [attachments, setAttachments] = React.useState<File[]>([]);

  const autoGen = () => setCode((name || 'NEW').slice(0,3).toUpperCase() + '-' + String(Date.now()).slice(-4));
  const reset = () => { setCode(''); setName(''); setCat(categories[0]); setUom('pcs'); setMin(0); setQty(0); setWh('Riyadh'); setLocation(''); setDept('Production'); setAttachments([]); };
  const duplicate = !!code && items.some(it=> it.code.trim().toLowerCase() === code.trim().toLowerCase());

  const save = (andContinue=false) => {
    if (!name.trim() || !code.trim() || duplicate) return;
    addItem({ name: name.trim(), code: code.trim(), category: cat, qty, unit: uom, minLevel: min, expiry: null, supplierRisk: 'Multiple', warehouse: wh, location: location || null });
    if (andContinue) { reset(); } else { setOpen(false); reset(); }
  };

  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('inv:add-item', onOpen as any);
    return () => window.removeEventListener('inv:add-item', onOpen as any);
  }, []);

  if (!open) return null;

  return (
    <div className="inv-overlay" onClick={()=> setOpen(false)}>
      <div className="inv-modal" style={{ width: 720 }} onClick={(e)=> e.stopPropagation()}>
        <div className="head">
          <div>➕ Add Item</div>
          <button onClick={()=> setOpen(false)} className="text-sm px-2 py-1 border rounded">✕</button>
        </div>
        <div className="body grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Item Code</label>
            <div className="flex gap-2">
              <input value={code} onChange={(e)=> setCode(e.currentTarget.value)} className={`h-10 rounded-xl border px-3 text-sm input-focus flex-1 ${duplicate? 'border-red-400 ring-red-300 ring-2':''}`} placeholder="e.g., RM-1001" />
              <button className="px-3 rounded border text-sm" onClick={autoGen}>Auto</button>
            </div>
            {duplicate && <div className="text-xs text-red-600 mt-1">Duplicate code — please choose another</div>}
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Item Name</label>
            <input value={name} onChange={(e)=> setName(e.currentTarget.value)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full" placeholder="e.g., Ball Bearing 6204" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Category</label>
            <select value={cat} onChange={(e)=> setCat(e.currentTarget.value)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full">
              {categories.map(c=> <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">UOM</label>
            <input value={uom} onChange={(e)=> setUom(e.currentTarget.value)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Min Level</label>
            <input type="number" value={min} onChange={(e)=> setMin(Number(e.currentTarget.value)||0)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Current Stock</label>
            <input type="number" value={qty} onChange={(e)=> setQty(Number(e.currentTarget.value)||0)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Warehouse</label>
            <select value={wh} onChange={(e)=> setWh(e.currentTarget.value as any)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full">
              {warehouses.map(w=> <option key={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Location</label>
            <input value={location} onChange={(e)=> setLocation(e.currentTarget.value)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full" placeholder="e.g., A1-01" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Department</label>
            <select value={dept} onChange={(e)=> setDept(e.currentTarget.value)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full">
              {['Production','Maintenance','Procurement','Logistics','Quality','IT','Operations'].map(d=> <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="md:col-span-4">
            <label className="text-xs text-gray-600">Attachments</label>
            <input type="file" multiple onChange={(e)=> setAttachments(Array.from(e.currentTarget.files||[]))} className="block w-full text-sm" />
            {attachments.length>0 && (
              <div className="text-xs text-gray-500 mt-1">{attachments.map(f=> f.name).join(', ')}</div>
            )}
          </div>
          <div className="md:col-span-4 flex justify-end gap-2">
            <button className="px-3 py-2 rounded border" onClick={()=> setOpen(false)}>Cancel</button>
            <button className="px-3 py-2 rounded border" onClick={()=> save(true)}>Save & Add Another</button>
            <button className="px-3 py-2 rounded bg-gray-900 text-white" disabled={!code || !name || duplicate} onClick={()=> save(false)}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}
