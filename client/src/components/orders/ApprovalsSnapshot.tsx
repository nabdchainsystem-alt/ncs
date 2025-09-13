import React from 'react';
import { useOrders } from '../../context/OrdersContext';

export default function ApprovalsSnapshot() {
  const { orders } = useOrders();
  const pending = orders.filter(o=> o.status==='Open' || o.status==='In Progress').slice(0,8);
  return (
    <div className="orders-card p-4">
      <div className="font-semibold mb-2">Approvals Snapshot</div>
      <div className="table-wrap overflow-auto">
        <table className="u-table text-sm">
          <thead><tr><th>PO No</th><th>Vendor</th><th className="text-right">Amount</th><th>Status</th><th className="text-right">Action</th></tr></thead>
          <tbody>
            {pending.length===0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">No approvals pending</td></tr>}
            {pending.map(o=> (
              <tr key={o.id}>
                <td>{o.orderNo}</td>
                <td>{o.vendor}</td>
                <td className="text-right">{o.value.toLocaleString()} SAR</td>
                <td>{o.status}</td>
                <td className="text-right"><button className="px-2 py-1 text-xs rounded border hover:bg-gray-50">Approve</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
