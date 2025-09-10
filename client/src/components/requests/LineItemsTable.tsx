import React from "react";
import type { LineItem } from "./LineItemRow";

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
        <table className="min-w-full table-fixed w-full">
          <colgroup>
            <col style={{ width: "8rem" }} />      {/* CODE */}
            <col style={{ width: "auto" }} />       {/* DESCRIPTION (flex) */}
            <col style={{ width: "6rem" }} />      {/* QTY */}
            <col style={{ width: "6rem" }} />      {/* UNIT */}
            <col style={{ width: "8rem" }} />      {/* ACTIONS */}
            <col style={{ width: "6rem" }} />      {/* RFQ */}
          </colgroup>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-3 py-2">CODE</th>
              <th className="px-3 py-2">DESCRIPTION</th>
              <th className="px-3 py-2 text-center">QTY</th>
              <th className="px-3 py-2 text-center">UNIT</th>
              <th className="px-3 py-2 text-center">ACTIONS</th>
              <th className="px-3 py-2 text-center">RFQ</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((it) => (
              <tr key={it.id} className="align-middle divide-y divide-gray-200 border-b border-gray-200">
                <td className="px-3 py-2 truncate">{it.code}</td>
                <td className="px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis">{it.description}</td>
                <td className="px-3 py-2 text-center">{it.qty}</td> {/* read-only */}
                <td className="px-3 py-2 text-center">{it.unit}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(it)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                        title="Edit"
                        aria-label="Edit"
                      >
                        ✎
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(it)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                        title="Delete"
                        aria-label="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-center">
                  {onSendRFQ && (
                    <button
                      onClick={() => onSendRFQ(it)}
                      className="px-2 py-1 text-xs rounded border hover:bg-gray-50"
                    >
                      Send RFQ
                    </button>
                  )}
                </td>
              </tr>
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