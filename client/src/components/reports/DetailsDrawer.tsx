import React from 'react';
import { useReports } from '../../context/ReportsContext';
import '../../styles/reports.css';

const DetailsDrawer: React.FC = () => {
  const { details, closeDetails } = useReports();
  if (!details) return null;
  const { title, rows } = details;
  return (
    <div className="rep-drawer">
      <div className="rep-drawer-head">
        <div className="font-semibold">{title}</div>
        <button className="px-2 py-1 border rounded" onClick={closeDetails}>✕</button>
      </div>
      <div className="rep-drawer-body">
        <div className="table-wrap">
        <table className="min-w-full text-xs">
          <thead className="text-gray-500 bg-gray-50">
            <tr>{Object.keys(rows[0]||{col:'value'}).map((k)=> <th key={k} className="px-2 py-1 text-left">{k}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r,i)=> (
              <tr key={i} className="border-t">
                {Object.values(r).map((v,j)=> <td key={j} className="px-2 py-1">{String(v)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default DetailsDrawer;
