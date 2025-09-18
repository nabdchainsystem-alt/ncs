import React from 'react';
import '../styles/reports.css';
import { ReportsProvider, useReports } from '../context/ReportsContext';
import KPIs from '../components/reports/KPIs';
import DetailsDrawer from '../components/reports/DetailsDrawer';
import Cinematic from '../components/reports/Cinematic';
import ReportBlocks from '../components/reports/Blocks';
import PageHeader, { type PageHeaderItem } from '../components/layout/PageHeader';
import { Film, Play, Plus, PackagePlus, Upload, Boxes, Users, Wallet } from 'lucide-react';

function Shell() {
  const { setCinematic, generate } = useReports();
  const menuItems = React.useMemo<PageHeaderItem[]>(() => [
    { key: 'generate-report', label: 'Generate Report', icon: <Play className="w-4.5 h-4.5" />, onClick: () => generate() },
    { key: 'new-request', label: 'New Request', icon: <Plus className="w-4.5 h-4.5" />, disabled: true },
    { key: 'import-requests', label: 'Import Requests', icon: <Upload className="w-4.5 h-4.5" />, disabled: true },
    { key: 'new-material', label: 'New Material', icon: <PackagePlus className="w-4.5 h-4.5" />, disabled: true },
    { key: 'import-materials', label: 'Import Materials', icon: <Boxes className="w-4.5 h-4.5" />, disabled: true },
    { key: 'new-vendor', label: 'New Vendor', icon: <Users className="w-4.5 h-4.5" />, disabled: true },
    { key: 'new-payment-request', label: 'New Payment Request', icon: <Wallet className="w-4.5 h-4.5" />, disabled: true },
  ], [generate]);
  return (
    <div className="reports-page px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PageHeader
        title="Reports"
        onSearch={() => {}}
        searchPlaceholder="Search reports…"
        menuItems={menuItems}
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
