import React from 'react';
import '../styles/reports.css';
import { ReportsProvider, useReports } from '../context/ReportsContext';
import KPIs from '../components/reports/KPIs';
import DetailsDrawer from '../components/reports/DetailsDrawer';
import Cinematic from '../components/reports/Cinematic';
import ReportBlocks from '../components/reports/Blocks';
import HeaderBar from '../components/ui/HeaderBar';
import { Film, Play, Plus, PackagePlus, Upload, Boxes, Users, Wallet } from 'lucide-react';

function Shell() {
  const { setCinematic, generate } = useReports();
  return (
    <div className="reports-page px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <HeaderBar
        title="Reports"
        onSearch={()=>{}}
        searchPlaceholder="Search reports…"
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
      <div className="u-card p-3"><KPIs /></div>
      <ReportBlocks />
      <DetailsDrawer />
      <Cinematic />
    </div>
  );
}

export default function Reports() {
  return (
    <ReportsProvider>
      <Shell />
    </ReportsProvider>
  );
}
