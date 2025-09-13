import React from 'react';
import '../styles/reports.css';
import { ReportsProvider, useReports } from '../context/ReportsContext';
import KPIs from '../components/reports/KPIs';
import DetailsDrawer from '../components/reports/DetailsDrawer';
import Cinematic from '../components/reports/Cinematic';
import ReportBlocks from '../components/reports/Blocks';
import HeaderBar from '../components/ui/HeaderBar';
import { Film, Play } from 'lucide-react';

function Shell() {
  const { setCinematic, generate } = useReports();
  return (
    <div className="reports-page px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <HeaderBar
        title="Reports"
        onSearch={()=>{}}
        searchPlaceholder="Search reports…"
        actions={[
          { key:'cine', label:'Cinematic', icon:<Film className='w-4 h-4' />, onClick:()=> setCinematic(true) },
          { key:'gen', label:'Generate', icon:<Play className='w-4 h-4' />, onClick:generate },
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
