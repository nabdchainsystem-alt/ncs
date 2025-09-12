import React from 'react';
import { useReports, TimeRange, Department, ReportType } from '../../context/ReportsContext';
import '../../styles/reports.css';

const TopBar: React.FC = () => {
  const { time, setTime, dept, setDept, type, setType, generate, setCinematic } = useReports();
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Reports Room 📊</h1>
        <div className="text-xs text-gray-500">Executive Cockpit with AI & Simulations</div>
      </div>
      <div className="rep-toolbar">
        <select className="btn" value={time} onChange={(e)=> setTime(e.target.value as TimeRange)}>
          {['Today','This Week','This Month','Quarter','Year'].map(x=> <option key={x}>{x}</option>)}
        </select>
        <select className="btn" value={dept} onChange={(e)=> setDept(e.target.value as Department)}>
          {['All','Procurement','Finance','Operations'].map(x=> <option key={x}>{x}</option>)}
        </select>
        <select className="btn" value={type} onChange={(e)=> setType(e.target.value as ReportType)}>
          {['Requests','Orders','Vendors','Inventory','ESG'].map(x=> <option key={x}>{x}</option>)}
        </select>
        <button className="btn primary" onClick={generate}>Generate Report</button>
        <button className="btn" onClick={()=> setCinematic(true)}>Cinematic Mode</button>
      </div>
    </header>
  );
};

export default TopBar;

