import React from 'react';

type QuoteRow = {
  requestNo: string;
  vendor: string;
  item: string;
  price: number;
  currency: string;
  validity: string; // ISO date
};

export default function QuotationsTable({ rows }: { rows: QuoteRow[] }) {
  return (
    <div className="card card-p">
      <div className="mb-3 text-sm font-semibold">Quotations</div>
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">Request No</th>
              <th className="px-3 py-2 text-left">Vendor</th>
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-left">Currency</th>
              <th className="px-3 py-2 text-left">Validity</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td className="px-3 py-6 text-center text-gray-500" colSpan={6}>No quotations yet</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="px-3 py-2">{r.requestNo}</td>
                <td className="px-3 py-2">{r.vendor}</td>
                <td className="px-3 py-2">{r.item}</td>
                <td className="px-3 py-2 text-right">{r.price.toLocaleString()}</td>
                <td className="px-3 py-2">{r.currency}</td>
                <td className="px-3 py-2">{r.validity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

