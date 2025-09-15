import React from 'react';
import { Plus, PackagePlus, Upload, Boxes, Users, Wallet, Search } from 'lucide-react';

type Handler = () => void;

export default function RequestsOrdersActionBar({
  onNewRequest = () => console.log('New Request'),
  onNewOrder = () => console.log('New Order'),
  onImportRequests = () => console.log('Import Requests'),
  onImportInventory = () => console.log('Import Inventory'),
  onImportVendor = () => console.log('Import Vendor'),
  onNewPayment = () => console.log('New Payment'),
  onAdvancedSearch = () => console.log('Advanced Search'),
}: {
  onNewRequest?: Handler;
  onNewOrder?: Handler;
  onImportRequests?: Handler;
  onImportInventory?: Handler;
  onImportVendor?: Handler;
  onNewPayment?: Handler;
  onAdvancedSearch?: Handler;
}) {
  const Tile = ({ label, icon, onClick, primary }: { label: string; icon: React.ReactNode; onClick: Handler; primary?: boolean }) => (
    <div className="shrink-0 w-[64px] h-[64px] flex items-center justify-center">
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={onClick}
        className={`h-12 w-12 rounded-[12px] border transition-all duration-150 grid place-items-center text-gray-600 hover:bg-gray-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
          primary ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' : 'bg-white'
        }`}
      >
        {icon}
      </button>
    </div>
  );

  return (
    <section className="rounded-2xl border bg-white shadow-card px-4 py-3">
      <div className="flex items-center gap-4">
        <div className="text-[16px] font-semibold text-gray-900">Quick Actions</div>
        <nav aria-label="Quick actions" className="flex-1">
          <div className="grid grid-flow-col auto-cols-max gap-10 overflow-x-auto no-scrollbar">
            <Tile label="New Request" icon={<Plus className="w-5 h-5" />} onClick={onNewRequest} />
            <Tile label="New Order" icon={<PackagePlus className="w-5 h-5" />} onClick={onNewOrder} />
            <Tile label="Import Requests" icon={<Upload className="w-5 h-5" />} onClick={onImportRequests} />
            <Tile label="Import Inventory" icon={<Boxes className="w-5 h-5" />} onClick={onImportInventory} />
            <Tile label="Import Vendor" icon={<Users className="w-5 h-5" />} onClick={onImportVendor} />
            <Tile label="New Payment" icon={<Wallet className="w-5 h-5" />} onClick={onNewPayment} />
            <Tile label="Advanced Search" icon={<Search className="w-5 h-5" />} onClick={onAdvancedSearch} />
          </div>
        </nav>
      </div>
    </section>
  );
}