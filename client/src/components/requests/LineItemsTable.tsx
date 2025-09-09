import React from "react";
import { LineItemRow, type LineItem } from "./LineItemRow";

export type LineItemsTableProps = {
  items: LineItem[];
  onEdit?: (item: LineItem) => void;
  onDelete?: (item: LineItem) => void;
  onSendRFQ?: (item: LineItem) => void;
};

const LineItemsTable: React.FC<LineItemsTableProps> = ({
  items,
  onEdit,
  onDelete,
  onSendRFQ,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 bg-white">
        <h3 className="text-sm font-semibold text-gray-800">Items</h3>
      </div>
      <div className="overflow-x-auto bg-white">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 text-center">Qty</th>
              <th className="px-3 py-2 text-center">Unit</th>
              <th className="px-3 py-2 text-center">Actions</th>
              <th className="px-3 py-2 text-center">RFQ</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((it) => (
              <LineItemRow
                key={it.id}
                item={it}
                onEdit={onEdit}
                onDelete={onDelete}
                onSendRFQ={onSendRFQ}
              />
            ))}
            {(!items || items.length === 0) && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-500">
                  No items
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LineItemsTable;