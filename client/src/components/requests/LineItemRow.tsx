import React from "react";
import Button from "../ui/Button";
import { Edit3, Trash2, Send } from "lucide-react";

export type LineItem = {
  id: string | number;
  code: string;
  description: string;
  qty: number;
  unit: string;
  status?: "Approved" | "Rejected" | "Pending" | string;
};

export type LineItemRowProps = {
  item: LineItem;
  onEdit?: (item: LineItem) => void;
  onDelete?: (item: LineItem) => void;
  onSendRFQ?: (item: LineItem) => void;
};

/**
 * A single line item row with: Code | Description | Qty | Unit | Actions | RFQ
 * Actions shows two tiny icon buttons: edit (✏️) and delete (🗑️)
 * RFQ shows a tiny "Send" button.
 */
export const LineItemRow: React.FC<LineItemRowProps> = ({
  item,
  onEdit,
  onDelete,
  onSendRFQ,
}) => {
  return (
    <tr className="align-middle">
      {/* Code */}
      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.code}</td>

      {/* Description */}
      <td className="px-3 py-2 text-sm text-gray-700">{item.description}</td>

      {/* Qty */}
      <td className="px-3 py-2 text-sm text-gray-700 text-center">{item.qty}</td>

      {/* Unit */}
      <td className="px-3 py-2 text-sm text-gray-700 text-center">{item.unit}</td>

      {/* Actions */}
      <td className="px-3 py-2 text-center">
        <div className="inline-flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            title="Edit"
            onClick={() => onEdit && onEdit(item)}
            className="p-0 h-8 w-8 rounded-md"
          >
            <Edit3 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            title="Delete"
            onClick={() => onDelete && onDelete(item)}
            className="p-0 h-8 w-8 rounded-md"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>

      {/* RFQ */}
      <td className="px-3 py-2 text-center">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onSendRFQ && onSendRFQ(item)}
          className="rounded-md"
          disabled={item && (item as any).rfqSent === true || item.status === 'RFQ_SENT'}
        >
          <Send className="h-4 w-4 mr-1" />
          Send
        </Button>
      </td>
    </tr>
  );
};

// ------------------------------------------------------------
// Optional wrapper table to quickly plug into pages
// (Exported here to avoid creating a new file right now.)
// You can later move this component to `LineItemsTable.tsx` without changes.
// ------------------------------------------------------------
export type LineItemsTableProps = {
  items: LineItem[];
  onEdit?: (item: LineItem) => void;
  onDelete?: (item: LineItem) => void;
  onSendRFQ?: (item: LineItem) => void;
};

export const LineItemsTable: React.FC<LineItemsTableProps> = ({
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

export default LineItemRow;
