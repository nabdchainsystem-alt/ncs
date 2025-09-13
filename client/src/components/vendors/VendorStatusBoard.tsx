import React from 'react';
import { useVendors } from '../../context/VendorsContext';

export default function VendorStatusBoard(){
  const { vendors } = useVendors();
  const total = vendors.length || 1;
  const toLower = (s: any)=> String(s ?? '').toLowerCase();
  const approved = vendors.filter(v=> toLower(v.status).includes('approved')).length;
  const pending = vendors.filter(v=> toLower(v.status).includes('pending') || toLower(v.status).includes('evaluation')).length;
  const suspended = vendors.filter(v=> toLower(v.status).includes('suspend')).length;
  const pct = (n:number)=> Math.round((n/total)*100);
  return (
    <div className="u-card p-4">
      <div className="font-semibold mb-2">Vendor Status Board</div>
      <div className="space-y-2">
        <div className="rounded-xl border p-2 bg-white">
          <div className="text-sm font-medium mb-1">Approved</div>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-3" style={{ width: (pct(approved)+'%'), background:'#10B981' }} /></div>
          <div className="text-xs text-gray-500 mt-1">{approved} vendors • {pct(approved)}%</div>
        </div>
        <div className="rounded-xl border p-2 bg-white">
          <div className="text-sm font-medium mb-1">Under Evaluation</div>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-3" style={{ width: (pct(pending)+'%'), background:'#F59E0B' }} /></div>
          <div className="text-xs text-gray-500 mt-1">{pending} vendors • {pct(pending)}%</div>
        </div>
        <div className="rounded-xl border p-2 bg-white">
          <div className="text-sm font-medium mb-1">Suspended</div>
          <div className="w-full h-3 rounded-full bg-gray-100 overflow-hidden"><div className="h-3" style={{ width: (pct(suspended)+'%'), background:'#EF4444' }} /></div>
          <div className="text-xs text-gray-500 mt-1">{suspended} vendors • {pct(suspended)}%</div>
        </div>
      </div>
    </div>
  );
}
