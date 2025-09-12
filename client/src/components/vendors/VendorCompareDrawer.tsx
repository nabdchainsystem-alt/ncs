import React from 'react';

interface Vendor {
  name: string;
  price?: string;
  leadTime?: string;
  paymentTerms?: string;
  warranty?: string;
  co2?: string;
  performance?: string;
}

interface VendorCompareDrawerProps {
  open: boolean;
  onClose: () => void;
  vendors: Vendor[];
}

const VendorCompareDrawer: React.FC<VendorCompareDrawerProps> = ({ open, onClose, vendors }) => {
  if (!open) return null;

  const fields = [
    { key: 'price', label: 'Price' },
    { key: 'leadTime', label: 'Lead Time' },
    { key: 'paymentTerms', label: 'Payment Terms' },
    { key: 'warranty', label: 'Warranty' },
    { key: 'co2', label: 'CO₂ Estimate' },
    { key: 'performance', label: 'Performance' },
  ] as const;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: 480,
      height: '100%',
      backgroundColor: '#fff',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.25)',
      zIndex: 1000,
      overflowY: 'auto',
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Vendor Comparison</h2>
        <button onClick={onClose} style={{ fontSize: 14, fontWeight: 600, padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#F9FAFB' }}>Close</button>
      </header>

      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #E5E7EB', padding: 8, textAlign: 'left' }}>Criteria</th>
            {vendors.slice(0, 4).map((v, i) => (
              <th key={i} style={{ border: '1px solid #E5E7EB', padding: 8, textAlign: 'center' }}>{v.name || `Vendor ${i+1}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map(({ key, label }) => (
            <tr key={key}>
              <td style={{ border: '1px solid #E5E7EB', padding: 8, fontWeight: 600 }}>{label}</td>
              {vendors.slice(0, 4).map((v, i) => (
                <td key={i} style={{ border: '1px solid #E5E7EB', padding: 8, textAlign: 'center' }}>{(v as any)[key] ?? '--'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VendorCompareDrawer;
