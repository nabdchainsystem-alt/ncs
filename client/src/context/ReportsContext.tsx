import React, { createContext, useContext, useMemo, useState } from 'react';

export type TimeRange = 'Today' | 'This Week' | 'This Month' | 'Quarter' | 'Year';
export type Department = 'All' | 'Procurement' | 'Finance' | 'Operations';
export type ReportType = 'Requests' | 'Orders' | 'Vendors' | 'Inventory' | 'ESG';

export type ReportsContextValue = {
  time: TimeRange; setTime: (t: TimeRange)=>void;
  dept: Department; setDept: (d: Department)=>void;
  type: ReportType; setType: (t: ReportType)=>void;
  generate: ()=>void; // placeholder
  kpis: { spend: number; savings: number; lead: number; otd: number; trust: number; coverage: number };
  widgets: string[]; setWidgets: (w: string[])=>void;
  openDetails: (title: string, rows: any[])=>void; closeDetails: ()=>void; details: { title: string; rows: any[] } | null;
  cinematic: boolean; setCinematic: (b:boolean)=>void;
};

const ReportsContext = createContext<ReportsContextValue | null>(null);

export const useReports = () => {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
};

export const ReportsProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [time, setTime] = useState<TimeRange>('This Month');
  const [dept, setDept] = useState<Department>('All');
  const [type, setType] = useState<ReportType>('Orders');
  const [widgets, setWidgets] = useState<string[]>(['kpis','chartA','chartB','table']);
  const [details, setDetails] = useState<{ title: string; rows: any[] } | null>(null);
  const [cinematic, setCinematic] = useState(false);

  const generate = () => { /* placeholder: could call API */ };

  const kpis = useMemo(() => ({
    spend: 12_300_000,
    savings: 8.2,
    lead: 14,
    otd: 86,
    trust: 78,
    coverage: 47,
  }), [time, dept, type]);

  const openDetails = (title: string, rows: any[]) => setDetails({ title, rows });
  const closeDetails = () => setDetails(null);

  const value: ReportsContextValue = useMemo(() => ({ time, setTime, dept, setDept, type, setType, generate, kpis, widgets, setWidgets, openDetails, closeDetails, details, cinematic, setCinematic }), [time, dept, type, kpis, widgets, details, cinematic]);

  return <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>;
};

export default ReportsContext;

