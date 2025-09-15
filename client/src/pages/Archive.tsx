import React from 'react';
import '../styles/archive.css';
import { ArchiveProvider } from '../context/ArchiveContext';
import HeaderBar from '../components/ui/HeaderBar';
import { Download, Plus, PackagePlus, Upload, Boxes, Users, Wallet } from 'lucide-react';
import Sidebar from '../components/archive/Sidebar';
import VaultGrid from '../components/archive/VaultGrid';
import FolderView from '../components/archive/FolderView';
import PreviewPanel from '../components/archive/PreviewPanel';
import { useArchive } from '../context/ArchiveContext';
import QuickJump from '../components/archive/QuickJump';

const actions = [
  { key: 'new-request', label: 'New Request', icon: <Plus className="w-5 h-5" />, onClick: () => console.log('New Request') },
  { key: 'new-order', label: 'New Order', icon: <PackagePlus className="w-5 h-5" />, onClick: () => console.log('New Order') },
  { key: 'new-payment', label: 'New Payment', icon: <Wallet className="w-5 h-5" />, onClick: () => console.log('New Payment') },
  { key: 'import-requests', label: 'Import Requests', icon: <Upload className="w-5 h-5" />, onClick: () => console.log('Import Requests') },
  { key: 'import-inventory', label: 'Import Inventory', icon: <Boxes className="w-5 h-5" />, onClick: () => console.log('Import Inventory') },
  { key: 'import-vendor', label: 'Import Vendor', icon: <Users className="w-5 h-5" />, onClick: () => console.log('Import Vendor') },
];

function Shell() {
  const { modules, active, setActive, currentFolder, openFolder, closeFolder } = useArchive();
  const backToModules = () => { /* simply clear folder -> handled by context via setting folder to null */ window.dispatchEvent(new CustomEvent('archive:back')); };
  return (
    <div className="arch-page px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <HeaderBar title="Archive" onSearch={()=>{}} actions={actions} />

      {!currentFolder && (
        <div className="space-y-6">
          <QuickJump />
          {modules.map((m) => (
            <section key={m.key} className={`arch-card p-4 ${m.color}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-bold">{m.label}</div>
                <button className="px-3 py-2 border rounded text-sm" onClick={()=> setActive(m.key)}>Focus</button>
              </div>
              <VaultGrid moduleKey={m.key} />
            </section>
          ))}
        </div>
      )}

      {currentFolder && (
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <button className="back-3d" onClick={closeFolder} aria-label="Back">◀</button>
            <button className="px-3 py-2 border rounded text-sm" onClick={()=> window.location.reload()}>Refresh</button>
          </div>
          <FolderView />
        </div>
      )}

      <PreviewPanel />
    </div>
  );
}

export default function Archive() {
  return (
    <ArchiveProvider>
      <Shell />
    </ArchiveProvider>
  );
}
