import React from 'react';
import { useInventory } from '../../context/InventoryContext';

export default function StatusBoard() {
  const { items } = useInventory();
  const status = (q:number, min:number)=> q<=0? 'Red' : q<min? 'Yellow' : 'Green';
  const groups = new Map<string, { Green:number; Yellow:number; Red:number }>();
  items.forEach(it=> {
    const g = groups.get(it.category) || { Green:0, Yellow:0, Red:0 };
    (g as any)[status(it.qty, it.minLevel)] += 1;
    groups.set(it.category, g);
  });
  const rows = Array.from(groups.entries());
  const total = items.length || 1;
  const pct = (n:number)=> Math.round((n/total)*100);
  return (
    <div className="u-card p-4">
      <div className="font-semibold mb-2">Stock Status Board</div>
      <div className="space-y-2">
        {rows.map(([cat, v])=> (
          <div key={cat} className="rounded-xl border p-2 bg-white">
            <div className="text-sm font-medium mb-1">{cat}</div>
            <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-3" style={{ width:`${pct(v.Green)}%`, background:'#10B981' }} />
              <div className="h-3" style={{ width:`${pct(v.Yellow)}%`, background:'#F59E0B' }} />
              <div className="h-3" style={{ width:`${pct(v.Red)}%`, background:'#EF4444' }} />
            </div>
            <div className="text-xs text-gray-500 mt-1">Green {v.Green} • Yellow {v.Yellow} • Red {v.Red}</div>
          </div>
        ))}
        {rows.length===0 && <div className="text-sm text-gray-500">No items</div>}
      </div>
    </div>
  );
}

