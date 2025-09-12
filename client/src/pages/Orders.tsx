import React from 'react';
import '../styles/orders.css';
import { OrdersProvider } from '../context/OrdersContext';
import OrdersHeader from '../components/orders/OrdersHeader';
import OrdersKPIs from '../components/orders/OrdersKPIs';
import OrdersTable from '../components/orders/OrdersTable';
import OrdersAlerts from '../components/orders/OrdersAlerts';
import OrderDrawer from '../components/orders/OrderDrawer';
import Hologram from '../components/orders/Hologram';
import { useOrders } from '../context/OrdersContext';

function OrdersShell() {
  const { hologram } = useOrders();
  return (
    <div className="orders-page px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <OrdersHeader />
      <OrdersKPIs />
      <OrdersTable />
      <OrdersAlerts />
      <OrderDrawer />
      {hologram && <Hologram />}
    </div>
  );
}

export default function Orders() {
  return (
    <OrdersProvider>
      <OrdersShell />
    </OrdersProvider>
  );
}
