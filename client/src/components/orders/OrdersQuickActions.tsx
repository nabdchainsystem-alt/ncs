import React from 'react';

export default function OrdersQuickActions() {
  const downloadPdf = () => alert('Download PO PDF — select an order first');
  const exportData = () => alert('Export Orders Data (CSV/XLSX)');
  const genMonthlySpend = () => alert('Generate Monthly Spend Report');
  const vendorPerf = () => alert('Vendor Performance Report');

  const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className='', ...rest }) => (
    <button {...rest} className={`h-12 rounded-xl border bg-white shadow-card hover:shadow-lg-soft px-4 text-sm font-semibold ${className}`} />
  );
  return (
    <div className="orders-card p-4">
      <div className="font-semibold mb-2">Quick Actions</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Btn onClick={downloadPdf}>📂 Download PO PDF</Btn>
        <Btn onClick={exportData}>📊 Export Orders Data</Btn>
        <Btn onClick={genMonthlySpend}>📈 Monthly Spend Report</Btn>
        <Btn onClick={vendorPerf}>🔍 Vendor Performance Report</Btn>
      </div>
    </div>
  );
}

