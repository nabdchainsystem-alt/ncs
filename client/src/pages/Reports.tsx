import React from 'react';
import '../styles/reports.css';
import { ReportsProvider } from '../context/ReportsContext';
import TopBar from '../components/reports/TopBar';
import KPIs from '../components/reports/KPIs';
import DetailsDrawer from '../components/reports/DetailsDrawer';
import Cinematic from '../components/reports/Cinematic';
import ReportBlocks from '../components/reports/Blocks';

function Shell() {
  return (
    <div className="reports-page px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <TopBar />
      <KPIs />
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
