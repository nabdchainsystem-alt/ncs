import React from 'react';
import { useInventory } from '../../context/InventoryContext';
import { Bell, RefreshCw, UploadCloud, Plus, DownloadCloud } from 'lucide-react';
import PageHeader from '../layout/PageHeader';

const Header: React.FC = () => {
  const { query, setQuery, addItem } = useInventory();
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function onImportFile(file: File) {
    try {
      const name = file.name.toLowerCase();
      if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        rows.forEach((r) => {
          const code = r['Material Code'] || r['code'] || r['Item Code'] || '';
          const name = r['Material Description'] || r['name'] || r['Item Name'] || '';
          const qty = Number(r['Quantity'] ?? r['qty'] ?? 0) || 0;
          const unit = r['Unit'] || r['unit'] || 'pcs';
          const minLevel = Number(r['Min Stock Level'] ?? r['minLevel'] ?? 0) || 0;
          const warehouse = (r['Warehouse'] || r['warehouse'] || 'Riyadh') as any;
          const location = r['Location'] || r['location'] || '';
          const category = r['Category'] || r['category'] || 'Spare Part';
          if (String(code).trim() && String(name).trim()) {
            addItem({ code: String(code).trim(), name: String(name).trim(), qty, unit, minLevel, warehouse, location, category, expiry: null, supplierRisk: 'Multiple' });
          }
        });
      } else if (name.endsWith('.csv')) {
        const text = await file.text();
        // Simple CSV parsing
        const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(Boolean);
        if (!lines.length) return;
        const headers = lines[0].split(',').map((h) => h.replace(/^\"|\"$/g, '').trim());
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map((c) => c.replace(/^\"|\"$/g, ''));
          const row: any = {};
          headers.forEach((h, idx) => (row[h] = cols[idx] ?? ''));
          const code = row['Material Code'] || row['code'] || row['Item Code'] || '';
          const name = row['Material Description'] || row['name'] || row['Item Name'] || '';
          const qty = Number(row['Quantity'] ?? row['qty'] ?? 0) || 0;
          const unit = row['Unit'] || row['unit'] || 'pcs';
          const minLevel = Number(row['Min Stock Level'] ?? row['minLevel'] ?? 0) || 0;
          const warehouse = (row['Warehouse'] || row['warehouse'] || 'Riyadh') as any;
          const location = row['Location'] || row['location'] || '';
          const category = row['Category'] || row['category'] || 'Spare Part';
          if (String(code).trim() && String(name).trim()) {
            addItem({ code: String(code).trim(), name: String(name).trim(), qty, unit, minLevel, warehouse, location, category, expiry: null, supplierRisk: 'Multiple' });
          }
        }
      } else {
        alert('Unsupported file type. Please upload .xlsx or .csv');
      }
    } catch (e) {
      console.error('Inventory import failed', e);
      alert('Import failed. Please check the template and try again.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }
  const menuItems = [
    { key: 'new-request', label: 'New Request', icon: <Plus className="w-4.5 h-4.5" /> },
    { key: 'import-requests', label: 'Import Requests', icon: <UploadCloud className="w-4.5 h-4.5" /> },
    { key: 'new-material', label: 'New Material', icon: <Plus className="w-4.5 h-4.5" />, onClick: ()=> window.dispatchEvent(new CustomEvent('inv:add-item')) },
    { key: 'import-materials', label: 'Import Materials', icon: <UploadCloud className="w-4.5 h-4.5" />, onClick: ()=> fileRef.current?.click() },
    { key: 'new-vendor', label: 'New Vendor', icon: <Users className="w-4.5 h-4.5" /> },
    { key: 'import-vendors', label: 'Import Vendors', icon: <UploadCloud className="w-4.5 h-4.5" /> },
    { key: 'new-payment-request', label: 'New Payment Request', icon: <DownloadCloud className="w-4.5 h-4.5" /> },
  ];

  return (
    <header className="flex flex-col gap-4">
      <PageHeader
        title="Inventory"
        onSearch={(s)=> setQuery(s)}
        searchPlaceholder="Search: code, name, category, location"
        menuItems={menuItems}
      />
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) onImportFile(f); }} />
    </header>
  );
};

export default Header;
