import React from 'react';
import { API_URL } from '../../lib/api';
import { useVendors } from '../../context/VendorsContext';

export default function AddVendorTool(){
  const { vendors, reload } = useVendors();
  const [open,setOpen] = React.useState(false);
  const [code,setCode] = React.useState('');
  const [name,setName] = React.useState('');
  const [vat,setVat] = React.useState('');
  const [city,setCity] = React.useState('Riyadh');
  const [category,setCategory] = React.useState('Raw');
  const [rating,setRating] = React.useState(4);
  const [active,setActive] = React.useState(true);

  const auto = ()=> setCode((name||'VEN').slice(0,3).toUpperCase() + '-' + String(Date.now()).slice(-4));
  const duplicate = (!!code && vendors.some(v=> String(v.code||'').toLowerCase()===code.trim().toLowerCase())) || (!!vat && vendors.some(v=> String((v as any).vat||'').toLowerCase()===vat.trim().toLowerCase()));

  async function save(){
    if(!code.trim()||!name.trim()||duplicate) return;
    await fetch(`${API_URL}/api/vendors`,{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ code, name, status: active?'Approved':'Suspended', categories:[category], regions:[city], trustScore: rating*20 }) });
    await reload(); setOpen(false); setCode(''); setName(''); setVat(''); setCity('Riyadh'); setCategory('Raw'); setRating(4); setActive(true);
  }

  return (
    <div className="u-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">➕ Add Vendor Tool</div>
        <button className="px-3 py-2 rounded border text-sm hover:bg-gray-50" onClick={()=> setOpen(o=>!o)}>{open?'Close':'Open'}</button>
      </div>
      {open && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Vendor Code</label>
            <div className="flex gap-2">
              <input value={code} onChange={e=>setCode(e.currentTarget.value)} className={`h-10 rounded-xl border px-3 text-sm input-focus flex-1 ${duplicate?'border-red-400 ring-2 ring-red-300':''}`} />
              <button className="px-3 rounded border text-sm" onClick={auto}>Auto</button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600">Vendor Name</label>
            <input value={name} onChange={e=>setName(e.currentTarget.value)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">VAT Number</label>
            <input value={vat} onChange={e=>setVat(e.currentTarget.value)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">City</label>
            <input value={city} onChange={e=>setCity(e.currentTarget.value)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Category</label>
            <select value={category} onChange={e=>setCategory(e.currentTarget.value)} className="h-10 rounded-xl border px-3 text-sm input-focus w-full">
              {['Raw','Packaging','Spare Parts','Services'].map(c=> <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Rating</label>
            <input type="number" min={1} max={5} value={rating} onChange={e=>setRating(Math.max(1,Math.min(5,Number(e.currentTarget.value)||1)))} className="h-10 rounded-xl border px-3 text-sm input-focus w-full" />
          </div>
          <div>
            <label className="text-xs text-gray-600">Active</label>
            <select value={active?'Yes':'No'} onChange={e=>setActive(e.currentTarget.value==='Yes')} className="h-10 rounded-xl border px-3 text-sm input-focus w-full"><option>Yes</option><option>No</option></select>
          </div>
          <div className="md:col-span-4 flex justify-end gap-2">
            <button className="px-3 py-2 rounded border" onClick={()=> setOpen(false)}>Cancel</button>
            <button className="px-3 py-2 rounded bg-gray-900 text-white" disabled={!code||!name||duplicate} onClick={save}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
