import React, { useRef, useState } from 'react';

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
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await fetch('/api/vendors/import', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`import_failed_${res.status}`);
      if (onImport) onImport(importFile);
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

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Title */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Vendors Room</h1>
          <div className="text-xs text-gray-500">Supplier performance cockpit</div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex justify-center">
          <div className="flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder="Search vendors by name, code, category, CR..."
              className="border rounded pl-3 pr-3 py-2 text-sm w-[36rem] max-w-[42rem]"
            />
            <button type="submit" className="px-3 py-2 rounded bg-gray-900 text-white text-sm">Search</button>
          </div>
        </form>

        {/* Tools */}
        <div className="flex flex-wrap items-center gap-2" style={{ whiteSpace: 'nowrap' }}>
          <button data-glow onClick={onAdd} style={btn('primary')}>+ Add Vendor</button>

          {/* Import */}
          <button data-glow onClick={() => setShowImport(true)} style={btn()}>Import</button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Export */}
          <button data-glow onClick={() => setShowExport(true)} style={btn()}>Export</button>

          <button data-glow onClick={onCompliance} style={btn('success')}>Compliance</button>
          <button data-glow onClick={onRecompute} style={btn('violet')}>Recompute</button>
          <button data-glow onClick={onRiskScan} style={btn('warn')}>Risk Scan</button>
          <button data-glow onClick={onCarbon} style={btn('green')}>Carbon</button>
        </div>
      </div>

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
  width: 520,
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
