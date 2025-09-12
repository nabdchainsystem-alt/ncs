import React from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useOrders } from '../../context/OrdersContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const OrdersAnalytics: React.FC = () => {
  const { view } = useOrders();
  const byVendor: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  view.forEach(o=> { byVendor[o.vendor]=(byVendor[o.vendor]||0)+(o.value); byStatus[o.status]=(byStatus[o.status]||0)+1; const m=o.date.slice(0,7); byMonth[m]=(byMonth[m]||0)+o.value; });
  const months = Object.keys(byMonth).sort();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <div className="orders-card p-4">
        <div className="font-semibold mb-2">Orders by Vendor (Value)</div>
        <Bar data={{ labels:Object.keys(byVendor), datasets:[{ label:'SAR', data:Object.values(byVendor), backgroundColor:'#111827' }] }} options={{ indexAxis:'y' as const, plugins:{ legend:{ display:false } } }} />
      </div>
      <div className="orders-card p-4">
        <div className="font-semibold mb-2">Orders by Status</div>
        <Doughnut data={{ labels:Object.keys(byStatus), datasets:[{ data:Object.values(byStatus), backgroundColor:['#F59E0B','#3B82F6','#10B981','#EF4444']}] }} options={{ plugins:{ legend:{ position:'bottom' } }, cutout:'65%' }} />
      </div>
      <div className="orders-card p-4 lg:col-span-2">
        <div className="font-semibold mb-2">Monthly Value Trend</div>
        <Line data={{ labels: months, datasets:[{ label:'Value', data: months.map(m=>byMonth[m]), borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,.2)', tension:.35, fill:true }] }} options={{ plugins:{ legend:{ position:'bottom' } } }} />
      </div>
    </div>
  );
};

export default OrdersAnalytics;

