import React from 'react';
import { motion } from 'framer-motion';
import { useInventory } from '../../context/InventoryContext';
import '../../styles/inventory.css';

const KPIs: React.FC = () => {
  const { kpis } = useInventory();
  const items = [
    { label: 'Total Items', value: kpis.total },
    { label: 'Inventory Value', value: kpis.value, unit: 'SAR' },
    { label: 'Low Stock', value: kpis.low },
    { label: 'Out of Stock', value: kpis.out },
    { label: 'Categories', value: kpis.categories },
    { label: 'Turnover Rate', value: kpis.turnover, unit: 'x' },
    { label: 'Coverage Days', value: kpis.coverageDays, unit: 'days' },
  ].slice(0,6);
  return (
    <div className="space-y-2">
      <div className="inv-kpi">
      {items.map((c, i) => (
        <motion.div
          key={i}
          className="item transition duration-200 hover:shadow-lg hover:-translate-y-0.5"
          style={{ minHeight: 92 }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <div className="label">{c.label}</div>
          <div className="value">
            {c.value.toLocaleString()} {c.unit ? <span className="text-gray-500 text-sm font-semibold">{c.unit}</span> : null}
          </div>
        </motion.div>
      ))}
      </div>
    </div>
  );
};

export default KPIs;
