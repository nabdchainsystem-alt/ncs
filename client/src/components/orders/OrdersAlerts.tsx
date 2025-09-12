import React from 'react';
import { useOrders } from '../../context/OrdersContext';
import '../../styles/orders.css';

const OrdersAlerts: React.FC = () => {
  const { view, riskLevel } = useOrders();
  const overdue = view.filter(o=> new Date(o.deliveryDate).getTime() < Date.now() && o.status!=='Completed' && o.status!=='Canceled');
  const highRisk = view.filter(o=> riskLevel(o)==='high');
  const highValue = view.filter(o=> o.value > 1_000_000);
  const Card = ({title,count,color}:{title:string;count:number;color:string}) => (
    <div className="orders-card p-4" style={{ borderColor: color }}>
      <div className="text-sm text-gray-600">{title}</div>
      <div className="text-2xl font-bold" style={{ color }}>{count}</div>
    </div>
  );
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card title="Overdue Orders" count={overdue.length} color="#EF4444" />
      <Card title="High Risk Orders" count={highRisk.length} color="#F59E0B" />
      <Card title="High Value > 1M" count={highValue.length} color="#111827" />
    </div>
  );
};

export default OrdersAlerts;

