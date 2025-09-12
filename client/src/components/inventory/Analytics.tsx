import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const Analytics: React.FC = () => {
  const topItems = {
    labels: ['Bearing','Filter','Sensor','Valve','Mask','Grease','Hose'],
    data: [520, 420, 360, 300, 280, 230, 200],
  };
  const categories = {
    labels: ['Spare Parts','Safety','Consumables','Equipment','Chemicals'],
    data: [38, 22, 18, 12, 10],
  };
  const monthly = {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    rcv: [60,80,70,90,110,95,120,100,95,105,110,115],
    iss: [50,65,55,70,85,80,95,90,92,100,97,108],
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="inv-card p-4">
        <div className="font-semibold mb-2">Top Items by Stock</div>
        <Bar data={{ labels: topItems.labels, datasets: [{ label: 'Qty', data: topItems.data, backgroundColor: '#111827' }] }} options={{ indexAxis: 'y' as const, plugins: { legend: { display: false } } }} />
      </div>
      <div className="inv-card p-4">
        <div className="font-semibold mb-2">Top Categories</div>
        <Doughnut data={{ labels: categories.labels, datasets: [{ data: categories.data, backgroundColor: ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6'] }] }} options={{ plugins: { legend: { position: 'bottom' } }, cutout: '65%' }} />
      </div>
      <div className="inv-card p-4 lg:col-span-2">
        <div className="font-semibold mb-2">Monthly Receipts vs Issues</div>
        <Bar data={{ labels: monthly.labels, datasets: [{ label: 'Receipts', data: monthly.rcv, backgroundColor: '#10B981' }, { label: 'Issues', data: monthly.iss, backgroundColor: '#F59E0B' }] }} options={{ plugins: { legend: { position: 'bottom' } }, responsive: true }} />
      </div>
    </div>
  );
};

export default Analytics;

