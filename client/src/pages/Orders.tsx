import React from 'react';
import PageHeader from '../components/layout/PageHeader';
import { Plus, Upload, PackagePlus, Users, FileText } from 'lucide-react';

const menuItems = [
  { key: 'new-request', label: 'New Request', icon: <Plus className="w-4.5 h-4.5" /> },
  { key: 'import-requests', label: 'Import Requests', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-material', label: 'New Material', icon: <PackagePlus className="w-4.5 h-4.5" /> },
  { key: 'import-materials', label: 'Import Materials', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-vendor', label: 'New Vendor', icon: <Users className="w-4.5 h-4.5" /> },
  { key: 'import-vendors', label: 'Import Vendors', icon: <Upload className="w-4.5 h-4.5" /> },
  { key: 'new-payment-request', label: 'New Payment Request', icon: <FileText className="w-4.5 h-4.5" /> },
];

// Blank Orders page (reserved for future updates)
export default function Orders() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader title="Orders" menuItems={menuItems} />
    </div>
  );
}
