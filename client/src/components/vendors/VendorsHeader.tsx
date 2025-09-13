import React, { useRef, useState } from 'react';
import { API_URL } from '../../lib/api';
import HeaderBar, { type HeaderAction } from '../ui/HeaderBar';
import { UserPlus, UploadCloud, DownloadCloud, Download, SlidersHorizontal, ShieldCheck, RefreshCw, AlertTriangle, Leaf } from 'lucide-react';

type VendorsHeaderProps = {
  onAdd?: () => void;
  onImport?: (file: File) => void; // receives selected file
  onExport?: (opts?: { scope: 'all' | 'filtered' }) => void;
  onCompliance?: () => void;
  onRecompute?: () => void;
  onRiskScan?: () => void;
  onCarbon?: () => void;
  onSearch?: (q: string) => void; // NEW: propagate search text
  onOpenFilters?: () => void; // open overlay filters from header
};

const VendorsHeader: React.FC<VendorsHeaderProps> = ({
  onAdd,
  onImport,
  onExport,
  onCompliance,
  onRecompute,
  onRiskScan,
  onCarbon,
  onSearch,
  onOpenFilters,
}) => {
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('filtered');
  const [q, setQ] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImportFile(f);
  };

  const confirmImport = async () => {
    if (!importFile) return;
    try {
      const name = importFile.name.toLowerCase();
      // If XLSX, parse client-side to support extended columns; else fallback to server import
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const XLSX = await import('xlsx');
        const data = await importFile.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        for (const r of rows) {
          const payload: any = {
            code: String(r['Vendor Code'] || r['code'] || '').trim(),
            name: String(r['Vendor Name English'] || r['name'] || r['Vendor Name'] || r['Name'] || '').trim(),
            status: String(r['Status'] || 'Pending').trim(),
            categories: (r['Category'] ? [String(r['Category']).trim()] : []),
            regions: [],
            contacts: {
              nameAr: String(r['Vendor Name Arabic'] || '').trim() || undefined,
              contactPerson: String(r['Contact Person'] || '').trim() || undefined,
              phone: String(r['Phone'] || '').trim() || undefined,
              email: String(r['Email'] || '').trim() || undefined,
              address: String(r['Address'] || '').trim() || undefined,
            },
            bank: {
              bank: String(r['Bank'] || '').trim() || undefined,
              iban: String(r['IBAN'] || '').trim() || undefined,
              cr: String(r['CR'] || '').trim() || undefined,
              vat: String(r['VAT'] || '').trim() || undefined,
            },
          };
          if (!payload.code || !payload.name) continue;
          await fetch('/api/vendors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
        onImport?.(importFile);
      } else {
        const formData = new FormData();
        formData.append('file', importFile);
        const res = await fetch('/api/vendors/import', { method: 'POST', body: formData });
        if (!res.ok) throw new Error(`import_failed_${res.status}`);
        onImport?.(importFile);
      }
    } catch (e) {
      console.error('Import failed', e);
      alert('Import failed.');
    } finally {
      setShowImport(false);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmExport = async () => {
    try {
      const res = await fetch(`/api/vendors/export?scope=${exportScope}`);
      if (!res.ok) throw new Error(`export_failed_${res.status}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendors-${exportScope}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      onExport?.({ scope: exportScope });
    } catch (e) {
      console.error('Export failed', e);
      alert('Export failed.');
    } finally {
      setShowExport(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(q.trim());
  };

  const actions: HeaderAction[] = [
    // Put cloud icons (download template + upload/import) next to each other
    { key: 'template', label: 'Template', icon: <DownloadCloud className="w-4 h-4" />, href: '/templates/Vendors_Template.xlsx' },
    { key: 'import', label: 'Import', icon: <UploadCloud className="w-4 h-4" />, onClick: () => setShowImport(true) },
    { key: 'add', label: 'Add Vendor', icon: <UserPlus className="w-4 h-4" />, onClick: onAdd },
    { key: 'export', label: 'Export', icon: <Download className="w-4 h-4" />, onClick: () => setShowExport(true) },
    { key: 'filters', label: 'Filters', icon: <SlidersHorizontal className="w-4 h-4" />, onClick: onOpenFilters },
    { key: 'compliance', label: 'Compliance', icon: <ShieldCheck className="w-4 h-4" />, onClick: onCompliance },
    { key: 'recompute', label: 'Recompute', icon: <RefreshCw className="w-4 h-4" />, onClick: onRecompute },
    { key: 'risk', label: 'Risk Scan', icon: <AlertTriangle className="w-4 h-4" />, onClick: onRiskScan },
    { key: 'carbon', label: 'Carbon', icon: <Leaf className="w-4 h-4" />, onClick: onCarbon },
  ];

  return (
    <div>
      <HeaderBar
        title="Vendors"
        onSearch={(s)=> { setQ(s); onSearch?.(s); }}
        searchPlaceholder="Search vendors by name, code, category, CR..."
        actions={actions}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* Import Dialog */}
      {showImport && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>Import Vendors (CSV/XLSX)</div>
            <div style={{ padding: '12px 16px' }}>
              <p style={{ marginBottom: 8 }}>قم باختيار ملف الموردين. الصيغ المدعومة: CSV أو XLSX.</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={openFilePicker} style={btn()}>Choose File</button>
                <span style={{ color: '#555' }}>{importFile ? importFile.name : 'No file selected'}</span>
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
                <b>Expected columns</b>: code, name, status, categories[], regions[] (others optional)
              </div>
            </div>
            <div style={modalFooterStyle}>
              <button onClick={() => setShowImport(false)} style={btn()}>Cancel</button>
              <button disabled={!importFile} onClick={confirmImport} style={btn('primary')}>Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Dialog */}
      {showExport && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>Export Vendors</div>
            <div style={{ padding: '12px 16px' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input
                  type="radio"
                  name="export-scope"
                  checked={exportScope === 'filtered'}
                  onChange={() => setExportScope('filtered')}
                />
                <span>Current filters only</span>
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="radio"
                  name="export-scope"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                />
                <span>All vendors</span>
              </label>
            </div>
            <div style={modalFooterStyle}>
              <button onClick={() => setShowExport(false)} style={btn()}>Cancel</button>
              <button onClick={confirmExport} style={btn('primary')}>Export</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function btn(kind: 'primary' | 'dark' | 'success' | 'violet' | 'warn' | 'green' | undefined = undefined): React.CSSProperties {
  const base: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    background: '#fff',
    color: '#111827',
    fontWeight: 700,
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all .15s ease',
  };
  const map: Record<string, React.CSSProperties> = {
    primary: { background: '#111827', color: '#fff', borderColor: '#111827' },
    dark: { background: '#111827', color: '#fff', borderColor: '#111827' },
    success: { background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' },
    violet: { background: '#EEF2FF', color: '#4F46E5', borderColor: '#C7D2FE' },
    warn: { background: '#FFFBEB', color: '#92400E', borderColor: '#FDE68A' },
    green: { background: '#F0FDF4', color: '#166534', borderColor: '#BBF7D0' },
  };
  return { ...base, ...(kind ? map[kind] : {}) };
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
};

const modalStyle: React.CSSProperties = {
  width: 'min(90vw, 560px)',
  background: '#fff',
  borderRadius: 8,
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  overflow: 'hidden',
};

const modalHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #eee',
  fontWeight: 600,
};

const modalFooterStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderTop: '1px solid #eee',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
};

export default VendorsHeader;
