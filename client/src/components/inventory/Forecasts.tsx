import React from 'react';
import { Bar, Doughnut, Chart as ChartComponent } from 'react-chartjs-2';
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
  Filler,
} from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const demand = [120,140,130,160,170,150,180,190,175,165,172,185];
const stock = [200,180,170,160,140,130,120,115,110,108,100,96];

const Forecasts: React.FC = () => {
  const Mixed: any = ChartComponent;
  const stockouts = [
    { name: 'Conveyor Belt B-88', code: 'BLT-B88', eta: '12d' },
    { name: 'Air Filter A12', code: 'FLT-A12', eta: '18d' },
    { name: 'Motor 2.2kW', code: 'MTR-22', eta: '21d' },
  ];
  const dead = [
    { name: 'Valve 2-way 1"', code: 'VLV-1' },
    { name: 'Grease EP2', code: 'GRS-EP2' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div className="inv-card p-4 lg:col-span-2">
        <div className="font-semibold mb-2">Forecast Demand vs Current Stock</div>
        <Mixed type='bar'
          data={{
            labels: months,
            datasets: [
              { type: 'bar', label: 'Demand', data: demand, backgroundColor: '#3B82F6', yAxisID: 'y' },
              { type: 'line', label: 'Stock', data: stock, borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,.15)', yAxisID: 'y', tension: .35, fill: true },
            ]
          }}
          options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, animation: { duration: 900 }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#F3F4F6' } } } }}
        />
      </div>

      <div className="grid gap-3">
        <div className="inv-card p-4">
          <div className="font-semibold mb-2">Predicted Stockouts</div>
          <ul className="text-sm">
            {stockouts.map((s, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .05 }} className="flex items-center justify-between border-b py-1 last:border-b-0">
                <span>{s.name} <span className="text-gray-500">({s.code})</span></span>
                <span className="inv-badge low">ETA {s.eta}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <div className="inv-card p-4">
          <div className="font-semibold mb-2">Dead/Slow-Moving</div>
          <ul className="text-sm">
            {dead.map((d, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * .05 }} className="flex items-center justify-between border-b py-1 last:border-b-0">
                <span>{d.name} <span className="text-gray-500">({d.code})</span></span>
                <span className="inv-chip"><span className="dot"/>Review</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Forecasts;

