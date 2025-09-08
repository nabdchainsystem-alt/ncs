import React from "react";

type StockItem = {
  id: number;
  name: string;
  onHand: number;
  min: number;
  status: "ok" | "low" | "critical";
};

const mockStock: StockItem[] = [
  { id: 1, name: "Bearing 6204", onHand: 5, min: 10, status: "low" },
  { id: 2, name: "Pump Motor", onHand: 0, min: 3, status: "critical" },
  { id: 3, name: "Filter Cartridge", onHand: 25, min: 20, status: "ok" },
];

export default function StockAlert() {
  return (
    <div className="card card-p">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-base font-semibold">Stock Alert</h2>
        <button className="text-sm text-primary-600 hover:underline">View All</button>
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
          <tbody>
            {mockStock.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-2">{s.name}</td>
                <td className="px-4 py-2">{s.onHand}</td>
                <td className="px-4 py-2">{s.min}</td>
                <td className="px-4 py-2">
                  {s.status === "critical" && (
                    <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded">
                      Critical
                    </span>
                  )}
                  {s.status === "low" && (
                    <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded">
                      Low
                    </span>
                  )}
                  {s.status === "ok" && (
                    <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
                      OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
