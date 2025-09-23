import React from "react";

import { useInventoryItemsFromOrders } from "../../features/inventory/hooks";
import type { InventoryItemsFromOrdersRow } from "../../features/inventory/types";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  critical: { label: "Critical", className: "px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded" },
  low: { label: "Low", className: "px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded" },
  ok: { label: "OK", className: "px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded" },
};

export default function StockAlert() {
  const lowQuery = useInventoryItemsFromOrders({ page: 1, pageSize: 10, status: 'low-stock' });
  const outQuery = useInventoryItemsFromOrders({ page: 1, pageSize: 10, status: 'out-of-stock' });

  const rows = React.useMemo(() => {
    const lowItems = lowQuery.data?.items ?? [];
    const outItems = outQuery.data?.items ?? [];
    const combined = [...outItems, ...lowItems];
    const unique = new Map<string, InventoryItemsFromOrdersRow>();
    combined.forEach((item) => {
      const key = item.code || item.name;
      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });
    return Array.from(unique.values())
      .map((item) => ({
        id: item.code,
        name: item.name,
        onHand: item.qty,
        min: item.reorder,
        status: item.status === 'Out of Stock' ? 'critical' : item.status === 'Low Stock' ? 'low' : 'ok',
      }))
      .filter((row) => row.status !== 'ok')
      .sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === 'critical') return -1;
          if (b.status === 'critical') return 1;
        }
        return a.onHand - b.onHand;
      })
      .slice(0, 10);
  }, [lowQuery.data, outQuery.data]);

  const isLoading = lowQuery.isLoading || outQuery.isLoading;
  const error = lowQuery.error ?? outQuery.error;

  let content: React.ReactNode;
  if (isLoading) {
    content = (
      <tr>
        <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
          Loading inventory…
        </td>
      </tr>
    );
  } else if (error) {
    content = (
      <tr>
        <td colSpan={4} className="px-4 py-6 text-center text-sm text-red-600">
          Unable to load stock alerts.
        </td>
      </tr>
    );
  } else if (rows.length === 0) {
    content = (
      <tr>
        <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
          No low-stock alerts.
        </td>
      </tr>
    );
  } else {
    content = rows.map((row) => {
      const badge = STATUS_BADGES[row.status];
      return (
        <tr key={row.id} className="border-t">
          <td className="px-4 py-2">{row.name}</td>
          <td className="px-4 py-2">{row.onHand}</td>
          <td className="px-4 py-2">{row.min}</td>
          <td className="px-4 py-2">
            {badge ? <span className={badge.className}>{badge.label}</span> : <span>{row.status}</span>}
          </td>
        </tr>
      );
    });
  }

  return (
    <div className="card card-p">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-base font-semibold">Stock Alert</h2>
        <button className="text-sm text-primary-600 hover:underline" type="button">
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="px-4 py-2">Item</th>
              <th className="px-4 py-2">On Hand</th>
              <th className="px-4 py-2">Min</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>{content}</tbody>
        </table>
      </div>
    </div>
  );
}
