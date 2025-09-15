import React from 'react';
import HeaderBar from '../components/ui/HeaderBar';
import { Download, Plus, PackagePlus, Upload, Boxes, Users, Wallet } from 'lucide-react';

export default function Profile() {
  return (
    <div className="p-6 space-y-6">
      <HeaderBar
        title="Profile"
        onSearch={()=>{}}
        actions={[
          { key: 'new-request', label: 'New Request', icon: <Plus className="w-5 h-5" />, onClick: () => console.log('New Request') },
          { key: 'import-requests', label: 'Import Requests', icon: <Upload className="w-5 h-5" />, onClick: () => console.log('Import Requests') },
          { key: 'new-material', label: 'New Material', icon: <PackagePlus className="w-5 h-5" />, onClick: () => console.log('New Material') },
          { key: 'import-materials', label: 'Import Materials', icon: <Boxes className="w-5 h-5" />, onClick: () => console.log('Import Materials') },
          { key: 'new-vendor', label: 'New Vendor', icon: <Users className="w-5 h-5" />, onClick: () => console.log('New Vendor') },
          { key: 'import-vendors', label: 'Import Vendors', icon: <Upload className="w-5 h-5" />, onClick: () => console.log('Import Vendors') },
          { key: 'new-payment-request', label: 'New Payment Request', icon: <Wallet className="w-5 h-5" />, onClick: () => console.log('New Payment Request') },
        ]}
      />

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 lg:col-span-1">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-bold">U</div>
            <div>
              <div className="text-lg font-semibold">User Name</div>
              <div className="text-sm text-gray-500">user@example.com</div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Manage your personal information, password and preferences.
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm">
              <span className="text-gray-600">Full name</span>
              <input className="mt-1 w-full border rounded px-3 py-2 text-sm" defaultValue="User Name" />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">Email</span>
              <input className="mt-1 w-full border rounded px-3 py-2 text-sm" defaultValue="user@example.com" />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">Department</span>
              <input className="mt-1 w-full border rounded px-3 py-2 text-sm" defaultValue="Operations" />
            </label>
            <label className="text-sm">
              <span className="text-gray-600">Phone</span>
              <input className="mt-1 w-full border rounded px-3 py-2 text-sm" defaultValue="+966 555 000 000" />
            </label>
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button className="px-3 py-2 border rounded">Cancel</button>
            <button className="px-3 py-2 rounded bg-gray-900 text-white">Save changes</button>
          </div>
        </div>
      </section>
    </div>
  );
}
